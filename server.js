// server.js
const express = require('express');
const cors = require('cors');
const { createMollieClient } = require('@mollie/api-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Mollie client with your live API key
const mollieClient = createMollieClient({
  apiKey: test_ygGsTn9CNQAcHj3vkgNTKuVFcq7Qwk, // Your live API key goes here
});

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML files

// Create payment endpoint
app.post('/api/create-mollie-payment', async (req, res) => {
  try {
    const { amount, quantity, color, name, email, address, city } = req.body;
    
    // Create payment with Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount
      },
      description: `M2CONNECT Adapter ${color} (${quantity}x)`,
      redirectUrl: `${req.protocol}://${req.get('host')}/payment-success`,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook`,
      metadata: {
        order_id: Date.now().toString(),
        customer_name: name,
        customer_email: email,
        shipping_address: `${address}, ${city}`,
        quantity: quantity.toString(),
        color: color
      }
    });

    // Store order details in your database here
    // await saveOrderToDatabase(payment.id, req.body);

    res.json({
      paymentId: payment.id,
      checkoutUrl: payment.getCheckoutUrl(),
      status: payment.status
    });

  } catch (error) {
    console.error('Mollie payment creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment',
      details: error.message
    });
  }
});

// Webhook endpoint for payment status updates
app.post('/api/webhook', async (req, res) => {
  try {
    const paymentId = req.body.id;
    const payment = await mollieClient.payments.get(paymentId);
    
    console.log(`Payment ${paymentId} status: ${payment.status}`);
    
    if (payment.status === 'paid') {
      // Payment successful - process the order
      console.log('Payment successful!', payment.metadata);
      
      // Send confirmation email
      // await sendConfirmationEmail(payment.metadata);
      
      // Update order status in database
      // await updateOrderStatus(paymentId, 'paid');
      
      // Log order details for fulfillment
      console.log(`Order Details:
        - Product: M2CONNECT Adapter ${payment.metadata.color}
        - Quantity: ${payment.metadata.quantity}
        - Customer: ${payment.metadata.customer_name}
        - Email: ${payment.metadata.customer_email}
        - Address: ${payment.metadata.shipping_address}
        - Amount: €${payment.amount.value}
      `);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Payment success page
app.get('/payment-success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zahlung erfolgreich - M2CONNECT</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; 
                text-align: center; 
                padding: 100px 20px; 
                background: #fbfbfd;
            }
            .success-container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 60px 40px;
                border-radius: 18px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .checkmark {
                width: 80px;
                height: 80px;
                background: #34c759;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 30px;
                color: white;
                font-size: 40px;
            }
            h1 { color: #1d1d1f; margin-bottom: 20px; }
            p { color: #86868b; font-size: 17px; line-height: 1.5; margin-bottom: 30px; }
            .cta-button {
                display: inline-block;
                background: #0071e3;
                color: white;
                padding: 12px 24px;
                border-radius: 980px;
                text-decoration: none;
                font-size: 17px;
                transition: opacity 0.3s;
            }
            .cta-button:hover { opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="checkmark">✓</div>
            <h1>Vielen Dank für Ihre Bestellung!</h1>
            <p>Ihre Zahlung wurde erfolgreich verarbeitet. Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details zu Ihrer Bestellung.</p>
            <p>Ihr M2CONNECT Adapter wird in den nächsten 3-5 Werktagen versendet.</p>
            <a href="/" class="cta-button">Zurück zur Hauptseite</a>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure to set your MOLLIE_API_KEY in your .env file`);
});

module.exports = app;
  