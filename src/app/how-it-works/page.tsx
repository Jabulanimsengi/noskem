import { FaSearch, FaGavel, FaHandshake, FaBox, FaShoppingCart } from 'react-icons/fa';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: FaSearch,
      title: "1. Find What You Love",
      description: "Browse thousands of listings from sellers across the country or use our category filters to find exactly what you're looking for."
    },
    {
      icon: FaGavel,
      title: "2. Make an Offer or Buy Now",
      description: "Found the perfect item? You can either buy it instantly at the listed price or make a competitive offer to negotiate with the seller directly."
    },
    {
      icon: FaHandshake,
      title: "3. Secure Transactions",
      description: "Once your purchase or offer is accepted, pay securely through our trusted Paystack integration. We hold the funds until you confirm you've received your item."
    },
    {
      icon: FaBox,
      title: "4. Receive Your Item",
      description: "The seller will ship the item to our secure warehouse for inspection by one of our agents. Once it passes, it's sent directly to you. It's that simple and safe!"
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-100 p-4 overflow-hidden flex items-center">
        {/* Decorative Background Icons */}
        <FaShoppingCart className="absolute text-brand/5 text-[30rem] -top-24 -right-24 rotate-12" />
        <FaShoppingCart className="absolute text-brand/5 text-[20rem] -bottom-24 -left-32 -rotate-12" />

        <div className="relative container mx-auto max-w-4xl py-16 px-4 z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-brand">How It Works</h1>
            <p className="text-lg text-text-secondary mt-2">A simple, secure process for buyers and sellers.</p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-surface rounded-xl shadow-lg border">
                <div className="flex-shrink-0 bg-brand/10 text-brand p-4 rounded-full">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-text-secondary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}