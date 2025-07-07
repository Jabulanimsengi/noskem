// src/app/components/AvatarSelector.tsx
'use client';

import Image from 'next/image';
import { FaCheckCircle } from 'react-icons/fa';

// A list of pre-selected, high-quality avatar URLs from Pexels.
const avatars = [
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  'https://images.pexels.com/photos/874158/pexels-photo-874158.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
];

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onAvatarSelect: (url: string) => void;
}

export default function AvatarSelector({ selectedAvatar, onAvatarSelect }: AvatarSelectorProps) {
  return (
    <div>
      <p className="block text-sm font-medium text-text-secondary mb-2">Or choose an avatar:</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {avatars.map((url) => (
          <div key={url} className="relative">
            <button
              type="button"
              onClick={() => onAvatarSelect(url)}
              className={`w-full aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 ${
                selectedAvatar === url
                  ? 'border-brand ring-2 ring-brand'
                  : 'border-transparent hover:border-brand/50'
              }`}
            >
              <Image
                src={url}
                alt="Avatar option"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
            {selectedAvatar === url && (
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                <FaCheckCircle className="text-brand h-5 w-5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
