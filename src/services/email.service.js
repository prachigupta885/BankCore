require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});
// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank_Backend_System" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegisterationEmail(userEmail , userName){
    const subject = 'welcome to  Bank Backend System' ;
    const text = `hello ${userName} , \n\n thankyou for registering at   Bank Backend System
    we're excited to have you on board ! \n\n Best regards, \n The Bank Backend System.`;
    const html = `<p> Hello ${userName} , </p><p> thankyou for registering at   Bank Backend System
    we're excited to have you on board ! </p><p> Best regards, <br> The Bank Backend System. </p> `;
    await sendEmail(userEmail , subject , text , html);

}
async function sendTransactionEmail(userEmail , name , amount , toAccount){
  const subject = 'Transaction successFully!';
  const text = ` Hello ${name}, Your transaction was successful. Amount: ₹${amount} Transferred To Account: ${toAccount} Thank you for using our banking service. Regards, BankCore Team `;
  const html = ` <h2>Transaction Successful! ✅</h2> <p>Hello <strong>${name}</strong>,</p> <p>Your transaction was completed successfully.</p> <p> <strong>Amount:</strong> ₹${amount}<br> <strong>Transferred To Account:</strong> ${toAccount} </p> <p>Thank you for using our banking service.</p> <p> Regards,<br> <strong>BankCore Team</strong> </p> `;

  await sendEmail (userEmail , subject , text , html);
}

async function sendTransactionFailureEmail(userEmail , name , amount , toAccount){
  const subject = ' Transaction failed ';
  const text =` Hello ${name}, Unfortunately, your transaction could not be completed. Amount: ₹${amount} To Account: ${toAccount} Please check your account balance and transaction details, and try again. Regards, BankCore Team `;
  const html =` <h2>Transaction Failed ❌</h2> <p>Hello <strong>${name}</strong>,</p> <p>Unfortunately, your transaction could not be completed.</p> <p> <strong>Amount:</strong> ₹${amount}<br> <strong>To Account:</strong> ${toAccount} </p> <p> Please check your account balance and transaction details, and try again. </p> <p> Regards,<br> <strong>BankCore Team</strong> </p> `;
     await sendEmail (userEmail , subject , text , html);
}

module.exports = {
    sendRegisterationEmail,
    sendTransactionFailureEmail,
    sendTransactionEmail
}