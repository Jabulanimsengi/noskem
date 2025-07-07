// src/app/components/ConfirmationModal.tsx
'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from './Button';

// FIX: Update the props to accept the new properties for the input field
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  requiresInput?: boolean;
  inputValue?: string;
  setInputValue?: (value: string) => void;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  requiresInput = false,
  inputValue = '',
  setInputValue = () => {},
}: ConfirmationModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>

                {/* FIX: Conditionally render the input field */}
                {requiresInput && (
                  <div className="mt-4">
                    <label htmlFor="rejection-reason" className="sr-only">
                      Reason
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Provide a reason..."
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" onClick={onClose}>
                    {cancelText}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={onConfirm}
                    disabled={isConfirming}
                    className={isConfirming ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {isConfirming ? 'Processing...' : confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}