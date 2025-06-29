import https from 'https';

// Define the shape of the data needed for a transaction
interface PaystackTransactionData {
  email: string;
  amount: number; // Amount should be in the smallest currency unit (kobo for NGN, cents for ZAR)
  metadata?: Record<string, any>;
  callback_url?: string;
}

// Function to initialize a transaction with Paystack
export function createPaystackCheckout(data: PaystackTransactionData): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Paystack secret key is not configured.');
  }

  // Ensure metadata includes a cancel_action URL
  const params = JSON.stringify({
    email: data.email,
    amount: data.amount,
    metadata: {
      ...data.metadata,
      cancel_action: data.metadata?.cancel_action || `${process.env.NEXT_PUBLIC_BASE_URL}`,
    },
    callback_url: data.callback_url || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/verify`
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      'Content-Length': params.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (parsedData.status && parsedData.data.authorization_url) {
            resolve(parsedData.data.authorization_url);
          } else {
            reject(new Error(parsedData.message || 'Failed to initialize Paystack transaction.'));
          }
        } catch (error) {
          reject(new Error('Invalid response from Paystack.'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(params);
    req.end();
  });
}