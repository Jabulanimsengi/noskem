import Link from 'next/link';
import { Button } from '@/app/components/Button';
import { FaShoppingCart, FaShieldAlt, FaHandshake, FaBullseye } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-100 p-4 overflow-hidden">
      {/* Decorative Background Icons */}
      <FaShoppingCart className="absolute text-brand/5 text-[30rem] -top-24 -left-24 -rotate-12" />
      <FaShoppingCart className="absolute text-brand/5 text-[20rem] -bottom-24 -right-24 rotate-12" />

      <div className="relative container mx-auto max-w-4xl py-16 px-4 z-10">
        <div className="bg-surface rounded-xl shadow-2xl border p-8 md:p-12 space-y-10">
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-brand">About Noskem Marketplace</h1>
            <p className="text-lg text-text-secondary leading-relaxed mt-2">
              Welcome to Noskem Marketplace, South Africa's trusted platform for buying and selling quality second-hand goods with confidence and ease. We believe in creating a secure, fair, and transparent environment where everyone gets the value they deserve.
            </p>
          </div>

          <div className="pt-4 space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <FaBullseye className="text-brand text-5xl flex-shrink-0" />
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Our Mission: Power to the People</h2>
                    <p className="text-text-secondary leading-relaxed mt-2">
                        For too long, ordinary South Africans have been taken advantage of by a system that buys low and sells high, leaving the original owner with a fraction of their item's true worth. An item bought from you for R1,000 can be sold for R2,800 or more by a greedy corporation.
                        <br/><br/>
                        <strong className="text-text-primary">Noskem is here to change that.</strong> Our mission is simple: to put the power back into your hands. We are breaking the cycle of unfair trade by creating a marketplace built on safety, transparency, and respect for both buyers and sellers.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-6 pt-6 border-t">
                <FaShieldAlt className="text-brand text-5xl flex-shrink-0" />
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">How Noskem Protects You</h2>
                    <p className="text-text-secondary leading-relaxed mt-2">
                        Every transaction on our platform is designed with your safety in mind. We use a secure escrow system powered by Paystack, a trusted leader in online payments.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 mt-4 text-text-secondary">
                        <li><strong className="font-semibold">Buyer Pays:</strong> A buyer purchases an item, and the funds are securely held by Noskem.</li>
                        <li><strong className="font-semibold">Agent Verification:</strong> We dispatch one of our professional agents to physically inspect the item. They verify its condition and ensure it matches the seller's description.</li>
                        <li><strong className="font-semibold">Funds Released:</strong> Only after the item passes our agent's assessment are the funds released to the seller.</li>
                    </ol>
                    <p className="text-text-secondary leading-relaxed mt-2">
                        If an item is misrepresented or does not meet our standards, the order is cancelled, and the buyer receives a full refund. It's that simple.
                    </p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-3">For Our Sellers: Get the Price You Deserve</h3>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li><strong className="font-semibold">Safety First:</strong> Meet buyers through a secure, verified platform. No more risky meetups or cash deals.</li>
                    <li><strong className="font-semibold">Fair Value:</strong> You set the price. You negotiate. You get the value you deserve, free from the pressure of lowball offers from traditional pawnshops.</li>
                    <li><strong className="font-semibold">We Handle the Hassle:</strong> Our agents handle the verification and collection, making the process seamless and secure.</li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-3">For Our Buyers: Shop with Absolute Confidence</h3>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li><strong className="font-semibold">Verified Sellers:</strong> Every seller on our platform is verified, creating a trusted community.</li>
                    <li><strong className="font-semibold">Agent Inspection:</strong> Our mandatory agent inspection is your ultimate guarantee. An expert physically assesses the item before it's collected for delivery, ensuring what you see is what you get.</li>
                    <li><strong className="font-semibold">Secure Payments:</strong> Your money is held safely in escrow and is only released once you can be sure the item is legitimate.</li>
                </ul>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h2 className="text-2xl font-bold text-text-primary text-center">Our Transparent Pricing</h2>
            <p className="text-text-secondary text-center mt-2">We believe in clear and honest pricing with no hidden fees. The seller is responsible for a small fee to ensure the quality and safety of the platform for everyone. This includes:</p>
            <div className="mt-4 bg-gray-100 p-6 rounded-lg max-w-md mx-auto">
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Inspection & Assessment Fee:</strong> A flat fee of <strong>R199</strong> is deducted from the final sale amount.</li>
                    <li><strong>Commission:</strong> A standard <strong>10% commission</strong> is charged on the final sale price.</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="font-semibold">Example Breakdown:</p>
                    <p>If a TV is sold for <strong>R2,900</strong>:</p>
                    <ul className="list-none space-y-1 mt-2 text-sm">
                        <li>Inspection Fee: - R199</li>
                        <li>10% Commission: - R290</li>
                        <li className="font-bold text-brand">Total Paid to Seller: R2,411</li>
                    </ul>
                </div>
            </div>
            <p className="text-center text-sm text-text-secondary mt-4">This model ensures that sellers still receive the vast majority of their item's value—a stark contrast to the low offers from pawnshops, who might offer R1,000 or less for the same item.</p>
          </div>
          
          <div className="pt-8 text-center border-t">
            <h2 className="text-2xl font-bold text-text-primary">Join a Fairer Marketplace</h2>
            <p className="text-text-secondary mt-2">At Noskem Marketplace, we're not just building a platform; we're building a community founded on trust and fairness. Join us and experience the new way to buy and sell second-hand goods.</p>
            <div className="mt-6">
                <Link href="/signup">
                    <Button size="lg">Join Our Community Today</Button>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
