import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { google } from "googleapis";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import axios from "axios";

dotenv.config();

const LOGS: string[] = [];
function log(msg: string) {
  const entry = `${new Date().toISOString()} - ${msg}`;
  console.log(entry);
  LOGS.push(entry);
  if (LOGS.length > 100) LOGS.shift();
}

import { GoogleAuth } from 'google-auth-library';

const SOGNI_SYS_SECRET = 'SOGNI_SYS_SECRET_BA91';

async function getAccessToken() {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";

// Initialize Firebase SDKs
let adminDb: any;
let clientDb: any;
let firebaseApp: any;

async function initFirebase() {
  try {
    const firebaseConfigFile = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(firebaseConfigFile)) {
      const rawConfig = JSON.parse(await fs.promises.readFile(firebaseConfigFile, "utf-8"));
      const config = {
        ...rawConfig,
        projectId: rawConfig.projectId?.trim(),
        firestoreDatabaseId: rawConfig.firestoreDatabaseId?.trim()
      };
      
      // 1. Client SDK (Bypasses some server-side permission issues by acting as a client)
      firebaseApp = initializeApp(config);
      clientDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
      log("Firebase Client SDK initialized on backend.");
      
      // 2. Admin SDK (For privileged operations)
      try {
        const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
          ? config.firestoreDatabaseId 
          : undefined;
          
        log(`Initializing Admin SDK. Project: ${config.projectId}, Database: ${dbId || '(default)'}`);
        
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: config.projectId
          });
        }
        
        const app = admin.app();
        adminDb = dbId ? getAdminFirestore(app, dbId) : getAdminFirestore(app);
        
        // Verify admin access
        log("Testing Administrative access...");
        const adminTest = await adminDb.collection("users").limit(1).get();
        log(`Firebase Admin initialized successfully. Found ${adminTest.size} users.`);
      } catch (adminError: any) {
        log(`CRITICAL: Administrative access failed: ${adminError.message}`);
        log(`Stack: ${adminError.stack}`);
        
        // Don't fall back to default database silently if it's likely to fail too
        if (!admin.apps.length) admin.initializeApp();
        adminDb = getAdminFirestore();
        if (!clientDb) clientDb = adminDb;
      }
    } else {
      log("firebase-applet-config.json not found. Backend features may be limited.");
      if (!admin.apps.length) admin.initializeApp();
      adminDb = getAdminFirestore();
      clientDb = adminDb; 
    }
  } catch (error: any) {
    log(`Critical Firebase Initialization Error: ${error.message}`);
  }
}

await initFirebase();

// Helper to write to Firestore via REST (using API Key)
function mapFirestoreFields(fields: any) {
  const data: any = {};
  for (const [k, v] of Object.entries(fields || {})) {
    const val = v as any;
    if ('stringValue' in val) data[k] = val.stringValue;
    else if ('integerValue' in val) data[k] = parseInt(val.integerValue);
    else if ('doubleValue' in val) data[k] = val.doubleValue;
    else if ('booleanValue' in val) data[k] = val.booleanValue;
    else if ('timestampValue' in val) data[k] = val.timestampValue;
    else if ('mapValue' in val) data[k] = mapFirestoreFields(val.mapValue.fields);
    else if ('arrayValue' in val) data[k] = (val.arrayValue.values || []).map((av: any) => {
      if ('stringValue' in av) return av.stringValue;
      if ('mapValue' in av) return mapFirestoreFields(av.mapValue.fields);
      return av;
    });
    else data[k] = val;
  }
  return data;
}

async function privilegedFirestoreGet(docPath: string) {
  try {
    log(`Executing Privileged Get: ${docPath}`);
    if (adminDb) {
      log("Using Admin SDK for get...");
      const snapshot = await adminDb.doc(docPath).get();
      if (snapshot.exists) {
        log(`Admin SDK found result: ${snapshot.id}`);
        return { id: snapshot.id, data: snapshot.data() };
      }
      log("Admin SDK: Document not found.");
      return null;
    }

    log("Admin SDK not available, falling back to REST API...");
    const token = await getAccessToken();
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/${docPath}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data) {
      return { 
        id: response.data.name.split('/').pop(), 
        data: mapFirestoreFields(response.data.fields) 
      };
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Privileged Get Error:", error.response?.data || error.message);
    return null;
  }
}


async function privilegedFirestoreQuery(collectionId: string, field: string, value: string) {
  try {
    const dbName = adminDb?._databaseId || '(default)';
    log(`Executing Privileged Query on DB [${dbName}]: ${collectionId}.${field} == ${value}`);
    if (adminDb) {
      log("Using Admin SDK for query...");
      const snapshot = await adminDb.collection(collectionId).where(field, "==", value).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        log(`Admin SDK found result: ${doc.id}`);
        return { id: doc.id, data: doc.data() };
      }
      log("Admin SDK: No results found.");
      return null;
    }

    log("Admin SDK not available, falling back to REST API...");
    const token = await getAccessToken();
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents:runQuery`;
    
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value }
          }
        },
        limit: 1
      }
    };

    const response = await axios.post(url, queryPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.length > 0 && response.data[0].document) {
      const doc = response.data[0].document;
      return { 
        id: doc.name.split('/').pop(), 
        data: mapFirestoreFields(doc.fields) 
      };
    }
    return null;
  } catch (error: any) {
    log(`Privileged Query Error: ${JSON.stringify(error?.message || error)}`);
    return null;
  }
}

async function firestoreRestWrite(collection: string, data: any) {
  const firebaseConfigFile = path.join(process.cwd(), "firebase-applet-config.json");
  const config = JSON.parse(await fs.promises.readFile(firebaseConfigFile, "utf-8"));
  
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/${collection}?key=${config.apiKey}`;
  
  // Convert JSON to Firestore REST format
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'number') fields[key] = { doubleValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (value === null) fields[key] = { nullValue: null };
    else if (Array.isArray(value)) fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } }; // Simplified
    else if (typeof value === 'object') fields[key] = { mapValue: { fields: {} } }; // Simplified
  }

  const response = await axios.post(url, { fields });
  return response.data;
}

function convertToFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(v => convertToFirestoreValue(v)) } };
  }
  if (typeof value === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = convertToFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

async function privilegedFirestoreWrite(collectionId: string, data: any) {
  try {
    log(`Executing Privileged Write to: ${collectionId}`);
    if (adminDb) {
      log("Using Admin SDK for write...");
      const docRef = await adminDb.collection(collectionId).add(data);
      log(`Admin SDK write successful: ${docRef.id}`);
      return { name: `documents/${collectionId}/${docRef.id}` };
    }

    log("Admin SDK not available, falling back to REST API...");
    const token = await getAccessToken();
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/${collectionId}`;

    const fields: any = {};
    for (const [key, value] of Object.entries(data)) {
      fields[key] = convertToFirestoreValue(value);
    }

    const response = await axios.post(url, { fields }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Privileged Write Error [${collectionId}]:`, error.response?.data || error.message);
    throw error;
  }
}

async function privilegedFirestoreUpdate(docPath: string, data: any) {
  try {
    log(`Executing Privileged Update to: ${docPath}`);
    if (adminDb) {
      log("Using Admin SDK for update...");
      await adminDb.doc(docPath).update(data);
      log("Admin SDK update successful.");
      return { success: true };
    }

    log("Admin SDK not available, falling back to REST API...");
    const token = await getAccessToken();
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/${docPath}`;

    const fields: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') fields[key] = { stringValue: value };
      else if (typeof value === 'number') fields[key] = { doubleValue: value };
      else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
      else if (value === null) fields[key] = { nullValue: null };
      else if (Array.isArray(value)) fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
      else if (typeof value === 'object' && value !== null) {
        fields[key] = { mapValue: { fields: {} } }; // Basic nesting
        // For simple objects like gmailTokens
        for (const [subK, subV] of Object.entries(value)) {
          fields[key].mapValue.fields[subK] = { stringValue: String(subV) };
        }
      }
    }

    const response = await axios.patch(url, { fields }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error("Privileged Update Error:", error.response?.data || error.message);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Google OAuth Setup
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
  );

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      firebase: {
        client: !!clientDb,
        admin: !!adminDb,
        apps: admin.apps.length
      }
    });
  });

  app.get("/api/debug/logs", (req, res) => {
    res.json({ logs: LOGS });
  });

  // Diagnostics to check API Key
  app.get("/api/debug/verify-key", async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key parameter" });
    try {
      const q = query(collection(clientDb, "users"), where("apiKey", "==", key as string), limit(1));
      const snapshot = await getDocs(q);
      res.json({ 
        exists: !snapshot.empty, 
        count: snapshot.size,
        message: snapshot.empty ? "Key not found in database" : "Key verified"
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Lead Capture API (Public)
  app.post("/api/leads/capture", async (req, res) => {
    console.log("Lead Capture Request Received:", { 
      body: { ...req.body, apiKey: req.body?.apiKey ? '***' : 'missing' },
      origin: req.headers['origin'] 
    });
    
    try {
      const { name, email, phone, website, businessType, source, message, apiKey, visitorData } = req.body;
      
      if (!apiKey) {
        return res.status(401).json({ error: "API Key required" });
      }

      // Find user with this API key via Privileged Query
      const userResult = await privilegedFirestoreQuery("users", "apiKey", apiKey);

      if (!userResult) {
        log("Lead Capture Error: Invalid API Key provided");
        return res.status(401).json({ error: "Invalid API Key" });
      }

      const uid = userResult.id;
      const userData = userResult.data;
      const cookieConfig = userData.cookieConfig || { enabled: false, collectIP: true, collectUserAgent: true };

      // Enrich lead with visitor behavior if enabled
      const meta: any = {};
      if (cookieConfig.enabled && visitorData) {
        meta.cookies = visitorData.cookies || {};
        meta.screen = visitorData.screen || {};
        meta.location = visitorData.location || {};
      }

      if (cookieConfig.collectIP) {
        meta.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      }

      if (cookieConfig.collectUserAgent) {
        meta.userAgent = req.headers['user-agent'];
      }

      // Create new lead via Privileged Write
      const newLeadRaw = {
        name: name || "Unknown",
        email: email || "",
        phone: phone || "",
        website: website || "",
        businessType: businessType || "",
        source: source || "Website",
        message: message || "",
        status: "New",
        value: 0,
        lastContacted: new Date().toISOString().split('T')[0],
        avatar: `https://picsum.photos/seed/${Math.random()}/100/100`,
        uid: uid,
        meta: Object.keys(meta).length > 0 ? meta : null,
        createdAt: new Date().toISOString(),
        _sys_secret: 'SOGNI_SYS_SECRET_BA91'
      };

      const leadResponse = await privilegedFirestoreWrite("leads", newLeadRaw);
      const leadId = leadResponse.name.split('/').pop();
      
      log(`New Lead Captured and Saved via Privileged Write: ${leadId}`);

      // Create Notification via Privileged Write
      await privilegedFirestoreWrite("notifications", {
        title: "New Lead Captured",
        message: `New lead from ${newLeadRaw.name} (${newLeadRaw.source})`,
        type: "lead",
        read: false,
        createdAt: new Date().toISOString(),
        uid: uid,
        _sys_secret: 'SOGNI_SYS_SECRET_BA91'
      });

      // Trigger Webhooks
      if (userData.webhooks) {
        const { n8n, zapier } = userData.webhooks;
        const webhookData = {
          event: "lead.captured",
          lead: { id: leadId, ...newLeadRaw },
          timestamp: new Date().toISOString()
        };

        if (n8n) {
          axios.post(n8n, webhookData).catch(err => console.error("n8n Webhook Error:", err.message));
        }
        if (zapier) {
          axios.post(zapier, webhookData).catch(err => console.error("Zapier Webhook Error:", err.message));
        }
      }
      
      res.json({ success: true, message: "Lead captured successfully", id: leadId });
    } catch (error: any) {
      console.error("Lead Capture Error:", error.message);
      res.status(500).json({ error: "Internal Server Error", detail: error.message });
    }
  });

  // Google OAuth URL
  app.get("/api/auth/google/url", async (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "User ID required" });

    // Verify user exists via privileged get
    const userResult = await privilegedFirestoreGet(`users/${uid}`);
    if (!userResult) {
      return res.status(404).json({ error: "User not found" });
    }

    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: uid as string
    });

    res.json({ url });
  });

  // Google OAuth Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const uid = state as string;

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens in Firestore associated with the user via Privileged Update
      await privilegedFirestoreUpdate(`users/${uid}`, {
        gmailConnected: true,
        gmailTokens: tokens,
        updatedAt: new Date().toISOString()
      });

      console.log(`Gmail connected for user ${uid}`);
      
      // Return a simple HTML page that sends a message to the opener and closes
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GMAIL_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Callback Error:", error);
      res.status(500).send("Authentication failed. Please try again.");
    }
  });

  // Gmail Messages API
  app.get("/api/gmail/messages", async (req, res) => {
    try {
      const { uid } = req.query;
      if (!uid) return res.status(400).json({ error: "UID required" });

      const userResult = await privilegedFirestoreGet(`users/${uid}`);
      if (!userResult) return res.status(404).json({ error: "User not found" });
      
      const userData = userResult.data;
      if (!userData?.gmailTokens) return res.status(401).json({ error: "Gmail not connected" });

      oauth2Client.setCredentials(userData.gmailTokens);

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const response = await gmail.users.messages.list({ userId: "me", maxResults: 15 });
      
      if (!response.data.messages) return res.json({ messages: [] });

      const messages = await Promise.all(
        response.data.messages.map(async (msg) => {
          const detail = await gmail.users.messages.get({ userId: "me", id: msg.id! });
          const payload = detail.data.payload;
          const headers = payload?.headers;
          
          return {
            id: msg.id,
            from: headers?.find(h => h.name === 'From')?.value || 'Unknown',
            subject: headers?.find(h => h.name === 'Subject')?.value || 'No Subject',
            body: detail.data.snippet || '',
            date: headers?.find(h => h.name === 'Date')?.value || '',
            read: !detail.data.labelIds?.includes('UNREAD'),
            starred: detail.data.labelIds?.includes('STARRED')
          };
        })
      );

      res.json({ messages });
    } catch (error) {
      console.error("Gmail Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  app.post("/api/gmail/send", async (req, res) => {
    try {
      const { uid, to, subject, body } = req.body;
      if (!uid) return res.status(400).json({ error: "UID required" });

      const userResult = await privilegedFirestoreGet(`users/${uid}`);
      if (!userResult) return res.status(404).json({ error: "User not found" });
      
      const userData = userResult.data;
      if (!userData?.gmailTokens) return res.status(401).json({ error: "Gmail not connected" });

      oauth2Client.setCredentials(userData.gmailTokens);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: <${userData.email}>`,
        `To: <${to}>`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        '',
        body
      ];
      const message = messageParts.join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Gmail Send Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // WhatsApp API integration
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { phone, message, templateId } = req.body;
      
      // In a real scenario, use Twilio, Meta WhatsApp API, or similar
      // For now, we simulate the success via log
      console.log(`Sending WhatsApp to ${phone}: ${message}`);
      
      // Mocking 1.5s delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      res.json({ success: true, messageId: `wa_${Math.random().toString(36).substr(2, 9)}` });
    } catch (error) {
      res.status(500).json({ error: "WhatsApp API Error" });
    }
  });

  // Social Media Insights API
  app.get("/api/social/stats", async (req, res) => {
    try {
      // Logic would involve fetching from Meta Business and TikTok Ads APIs
      res.json({
        instagram: { engagement: 4.8, followers: 12540, clicks: 1240 },
        facebook: { engagement: 2.2, followers: 24100, clicks: 840 },
        tiktok: { engagement: 8.5, followers: 8400, clicks: 3200 }
      });
    } catch (error) {
      res.status(500).json({ error: "Social API Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
