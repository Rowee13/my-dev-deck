'use client';

import { motion } from 'framer-motion';

const VALUE_PROPS = [
  {
    icon: '📜',
    title: 'Open source',
    description: 'MIT-licensed. Every line of code is on GitHub. Fork it, audit it, contribute back.',
  },
  {
    icon: '🏠',
    title: 'Self-hostable',
    description: 'Docker Compose runs the whole stack locally or on your own server. Your data stays yours.',
  },
  {
    icon: '🧰',
    title: 'Growing toolset',
    description: 'More tools are added over time. Suggest features, upvote what matters, shape the deck with us.',
  },
];

export function ValuePropsSection() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why My Dev Deck
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid md:grid-cols-3 gap-8"
        >
          {VALUE_PROPS.map((prop) => (
            <motion.div
              key={prop.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {prop.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {prop.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{prop.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
