import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any, // using older api version string cast to any for safety
});

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body;

    if (!['pro', 'agency'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
    }

    const domainURL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // If the user hasn't configured a real Stripe Key yet, mock the checkout
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
      return res.status(200).json({ 
        success: true, 
        url: `${domainURL}/checkout?plan=${plan}` 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan === 'pro' ? 'Pro Plan' : 'Agency Plan',
              description: plan === 'pro' ? 'For solo founders and small teams' : 'For growing agencies and larger teams',
            },
            unit_amount: plan === 'pro' ? 4900 : 14900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${domainURL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/#pricing`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    next(error);
  }
};
