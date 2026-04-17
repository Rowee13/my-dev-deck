'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { BrowserFrame } from './BrowserFrame';

export function ToolShowcaseSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tools in the deck
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A growing collection of utilities for everyday development work.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-12 items-center bg-slate-50 rounded-2xl p-8 md:p-12 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div>
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-4">
              Tool #1
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              DevInbox
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              A self-hosted email testing inbox. Route your app&apos;s transactional emails to DevInbox during development, inspect message content, headers, and attachments, and verify user signup flows without spamming real mailboxes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try DevInbox
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <BrowserFrame>
            <div className="relative aspect-[16/10]">
              <Image
                src="/landing/devinbox-preview.png"
                alt="DevInbox dashboard showing a list of received emails"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}
