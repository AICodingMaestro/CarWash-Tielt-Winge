import admin from 'firebase-admin';

export const initializeFirebase = async (): Promise<void> => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    if (!tokens.length) {
      console.log('⚠️ No FCM tokens provided');
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: tokens.filter(token => token && token.length > 0),
    };

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`✅ Push notification sent successfully: ${response.successCount}/${tokens.length}`);
    
    if (response.failureCount > 0) {
      console.log('⚠️ Some notifications failed:', response.responses
        .filter((resp, idx) => !resp.success)
        .map((resp, idx) => ({ token: tokens[idx], error: resp.error }))
      );
    }
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    throw error;
  }
};

export const sendTopicNotification = async (
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Topic notification sent successfully: ${response}`);
  } catch (error) {
    console.error('❌ Failed to send topic notification:', error);
    throw error;
  }
};

export const subscribeToTopic = async (tokens: string[], topic: string): Promise<void> => {
  try {
    await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`✅ Subscribed ${tokens.length} tokens to topic: ${topic}`);
  } catch (error) {
    console.error('❌ Failed to subscribe to topic:', error);
    throw error;
  }
};

export const unsubscribeFromTopic = async (tokens: string[], topic: string): Promise<void> => {
  try {
    await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`✅ Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
  } catch (error) {
    console.error('❌ Failed to unsubscribe from topic:', error);
    throw error;
  }
};

export default admin;