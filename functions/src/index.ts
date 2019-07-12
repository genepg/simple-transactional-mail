import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
import * as admin from 'firebase-admin';
admin.initializeApp();
const db = admin.firestore();

// Sendgrid Config
import * as sgMail from '@sendgrid/mail';
import { CallableContext } from 'firebase-functions/lib/providers/https';

const API_KEY = functions.config().sendgrid.key;
const TEMPLATE_ID = functions.config().sendgrid.template;
sgMail.setApiKey(API_KEY);

const SenderEmail = 'zscfde@gmail.com'

// Sends email to user after signup
export const welcomeEmail = functions.auth.user().onCreate(user => {
  const msg = {
    to: user.email,
    from: SenderEmail,
    templateId: TEMPLATE_ID,
    dynamic_template_data: {
      subject: 'Welcome to my awesome app!',
      name: user.displayName,
    },
  }

  return sgMail.send(msg);
})

// Sends email via HTTP. Can be called from frontend code.
export const genericEmail = functions.https.onCall(async (data, context: CallableContext) => {
  // const hasEmail = context.auth && context.auth.token.email
  // if(!hasEmail)
  if (!(context.auth && context.auth.token.email)) {
    throw new functions.https.HttpsError('failed-precondition', 'Must be logged with an email address');
  }

  const msg = {
    to: context.auth.token.email,
    from: SenderEmail,
    templateId: TEMPLATE_ID,
    dynamic_template_data: {
      subject: data.subject,
      text: data.text,
      name: data.name
    },
  };

  await sgMail.send(msg);

  return { success: true };
});


// Emails the author when a new comment is added to a post
export const newComment = functions.firestore.document('posts/{postId}/comments/{commentId}').onCreate(async (change, context) => {

  // Read the post document
  const postSnap = await db.collection('posts').doc(context.params.postId).get();

  // Raw Data
  const post = postSnap.data() || {};
  const comment = change.data() || {};

  // Email
  const msg = {
    to: post.authorEmail,
    from: SenderEmail,
    templateId: TEMPLATE_ID,
    dynamic_template_data: {
      subject: `New Comment on ${post.title}`,
      name: post.displayName,
      text: `${comment.user} said... ${comment.text}`
    },
  };

  return sgMail.send(msg);
});

// Send a summary email to all users
export const weeklySummary =  functions.pubsub.schedule('every friday 05:00').onRun(async context => {
  const userSnapshots = await admin.firestore().collection('users').get();

  const emails = userSnapshots.docs.map(snap => snap.data().email);

  const msg = {
      to: emails,
      from: SenderEmail,
      templateId: TEMPLATE_ID,
      dynamic_template_data: {
          subject: `Your Weekly Summary`,
          text: 'Insert summary here...'
      },
  };

  return sgMail.send(msg);
});
