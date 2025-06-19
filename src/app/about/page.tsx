// src/app/about/page.tsx
import Link from 'next/link';
import { Button } from '../components/Button';

export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <div className="bg-surface rounded-xl shadow-lg p-8 md:p-12 space-y-6">
          <h1 className="text-4xl font-bold text-brand text-center">About Noskem</h1>
          
          <p className="text-lg text-text-secondary leading-relaxed text-center">
            Welcome to Noskem, the marketplace built by South Africans, for South Africans. We believe that everyone deserves to get fair value for their pre-loved goods.
          </p>

          <div className="pt-4 space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">Our Story</h2>
            <p className="text-text-secondary leading-relaxed">
              Noskem was founded with a simple idea: to create a better alternative to pawnshops and classifieds where sellers often feel pressured and undervalued. We saw the need for a community where dignity and trust are at the forefront of every transaction. From electronics and fashion to furniture and collectibles, Noskem is the smart way to sell what you don't need and find what you do.
            </p>

            <h2 className="text-2xl font-bold text-text-primary pt-4">Our Commitment</h2>
            <p className="text-text-secondary leading-relaxed">
              We are committed to fostering a safe and vibrant community. Through features like our secure in-app chat, user verification, and a transparent offer system, we strive to make every interaction a positive one. Join us and become part of a movement that's restoring value and creating connections across the nation.
            </p>
          </div>
          
          <div className="pt-8 text-center">
            <Link href="/auth">
                <Button size="lg">Join Our Community Today</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}