'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQData {
  bn: FAQItem[];
  en: FAQItem[];
}

const faqData: FAQData = {
  bn: [
    {
      question: '🐾 বিড়াল হারিয়ে গেলে প্রথমে কী করবো?',
      answer: `প্রথমেই আশেপাশের নিরাপত্তাকর্মী, দারোয়ান, কেয়ারটেকার ও রোড পাহারাদারদের জানাতে হবে।
আপনার বিড়ালের স্পষ্ট ছবি দেখান এবং মোবাইল নম্বর দিয়ে আসুন।
"খুঁজে দিলে পুরস্কৃত করা হবে" বললে তারা আরও যত্নসহকারে খোঁজ রাখে।`,
    },
    {
      question: '🐾 যেসব বাসায় পাহারাদার নেই, সেখানে কী করবো?',
      answer: `টিনশেড বা পাহারাদারবিহীন বাসাগুলোতে সরাসরি বাড়ি বাড়ি গিয়ে ছবিসহ খোঁজ করুন এবং নম্বর দিয়ে আসুন।`,
    },
    {
      question: '🐾 কোন জায়গাগুলোতে জানানো বেশি কার্যকর?',
      answer: `মানুষের চলাচল বেশি এমন জায়গায় জানানো খুব কার্যকর:

চায়ের দোকান
ফার্মেসি
গ্রোসারি দোকান`,
    },
    {
      question: '🐾 দিনে কতবার খোঁজ করা উচিত?',
      answer: `দিনে কমপক্ষে দুইবার খোঁজ করুন—
ভোর/সকালে একবার এবং বিকেল/সন্ধ্যায় একবার।
রাতে ১০–১১টার দিকে শান্ত পরিবেশে বিড়াল সাড়া দিতে পারে
(নিজের নিরাপত্তা নিশ্চিত করবেন)।`,
    },
    {
      question: '🐾 বিড়াল ডাকতে গেলে কীভাবে ডাকবো?',
      answer: `ওর নাম ধরে ডাকুন।
আপনার কণ্ঠস্বর ও গায়ের গন্ধ বিড়াল দূর থেকেও চিনতে পারে।`,
    },
    {
      question: '🐾 হারানো বিড়াল সাধারণত কোথায় থাকে?',
      answer: `স্ট্রিট ক্যাট যেখানে থাকে সেখানে খেয়াল রাখুন:

আন্ডার-কনস্ট্রাকশন বিল্ডিং
কার পার্কিং
ডাস্টবিনের আশেপাশে`,
    },
    {
      question: '🐾 ময়লাওয়ালাকে জানানো কেন জরুরি?',
      answer: `অনেক সময় বিড়াল ভুল করে ঘরে ঢুকে ময়লার ব্যাগে চলে যেতে পারে।
তাই ময়লাওয়ালাকে আগেই জানানো জরুরি।`,
    },
    {
      question: '🐾 আত্মিকভাবে কী করা যেতে পারে? (ইসলামের আলোকে)',
      answer: `ইসলাম ধৈর্য, আশা এবং প্রাণীর প্রতি দয়ার শিক্ষা দেয়।
খোঁজার সময় আল্লাহকে স্মরণ করুন, দোয়া করুন এবং আশা রাখুন।
তাহাজ্জুদের নামাজ পড়ে দোয়া করলে মন শান্ত থাকে ও শক্তি পাওয়া যায়।`,
    },
    {
      question: '🐾 সোশ্যাল মিডিয়া কি কাজে আসে?',
      answer: `হ্যাঁ। ছবিসহ নিয়মিত পোস্ট করুন:

Lost & Found Pet গ্রুপে
এলাকার লোকাল ফেসবুক গ্রুপে`,
    },
    {
      question: '🐾 বাইরে লিটার বক্স রাখলে কি উপকার হয়?',
      answer: `হ্যাঁ। নিজের গন্ধ পেয়ে অনেক সময় বিড়াল নিজে থেকেই ফিরে আসে।`,
    },
    {
      question: '🐾 পেট শপ বা কাঁটাবনে খোঁজ নেওয়া কি দরকার?',
      answer: `হ্যাঁ। অনেক সময় পাওয়া গেলে বিড়াল পেট শপ বা কাঁটাবনে নিয়ে যাওয়া হয়।`,
    },
    {
      question: '📱 কিভাবে আমার পোষা প্রাণী রেজিস্টার করবো?',
      answer: `১. লগইন করুন এবং "My Pets" সেকশনে যান
২. "Add New Pet" বাটনে ক্লিক করুন
৩. আপনার পোষা প্রাণীর নাম, প্রকার, জাত, রঙ, জন্ম তারিখ ইত্যাদি তথ্য দিন
৪. পোষা প্রাণীর ছবি আপলোড করুন
৫. "Save" বাটনে ক্লিক করুন

রেজিস্টার করার পর আপনার পোষা প্রাণীর জন্য একটি ইউনিক QR কোড তৈরি হবে।`,
    },
    {
      question: '🔲 QR কোড কিভাবে কাজ করে?',
      answer: `প্রতিটি পোষা প্রাণীর জন্য একটি ইউনিক QR কোড তৈরি হয়।

যদি কেউ আপনার হারানো পোষা প্রাণী খুঁজে পায়:
১. তারা QR কোডটি স্ক্যান করবে
২. QR কোড স্ক্যান করলে আপনার কন্টাক্ট ইনফরমেশন দেখাবে
৩. তারা সরাসরি আপনার সাথে যোগাযোগ করতে পারবে

QR কোডটি আপনার পোষা প্রাণীর কলারে বা ট্যাগে লাগানো থাকলে হারিয়ে যাওয়ার পর সহজেই খুঁজে পাওয়া যাবে।`,
    },
    {
      question: '🏷️ কিভাবে পেট ট্যাগ অর্ডার করবো?',
      answer: `১. আপনার পোষা প্রাণীর প্রোফাইলে যান
২. "Order Pet Tag" অপশনে ক্লিক করুন
৩. ট্যাগের রঙ এবং সাইজ নির্বাচন করুন
৪. অর্ডার সম্পন্ন করুন এবং পেমেন্ট করুন
৫. অর্ডার ভেরিফাই হলে ট্যাগ প্রস্তুত করা হবে

ট্যাগে আপনার পোষা প্রাণীর QR কোড থাকবে যা হারিয়ে যাওয়ার পর সহজেই স্ক্যান করা যাবে।`,
    },
    {
      question: '💉 কিভাবে ভ্যাকসিন রেকর্ড যোগ করবো?',
      answer: `১. আপনার পোষা প্রাণীর প্রোফাইলে যান
২. "Vaccine Info" সেকশনে যান
৩. "Add Vaccine" বাটনে ক্লিক করুন
৪. ভ্যাকসিনের নাম, তারিখ, ক্লিনিকের নাম ইত্যাদি দিন
৫. প্রেসক্রিপশনের ছবি (যদি থাকে) আপলোড করুন
৬. "Save" বাটনে ক্লিক করুন

ভ্যাকসিন রেকর্ড রাখলে পরবর্তী ভ্যাকসিনের তারিখ মনে রাখা সহজ হবে।`,
    },
    {
      question: '🔍 কেউ যদি আমার পোষা প্রাণী খুঁজে পায় তাহলে কি করবে?',
      answer: `যদি আপনার পোষা প্রাণীর QR কোড থাকে:
১. QR কোডটি স্ক্যান করুন
২. মালিকের কন্টাক্ট ইনফরমেশন দেখতে পাবেন
৩. সরাসরি মালিকের সাথে যোগাযোগ করুন

QR কোড না থাকলে:
১. "Report Found Pet" সেকশনে যান
২. পাওয়া পোষা প্রাণীর ছবি এবং অবস্থান দিন
৩. প্ল্যাটফর্মে পোস্ট করা হবে এবং মালিক খুঁজে পেতে পারবে`,
    },
    {
      question: '💝 ডোনেশন কিভাবে করবো?',
      answer: `১. নেভিগেশনে "Donate" লিঙ্কে ক্লিক করুন
২. পেমেন্ট মেথড নির্বাচন করুন (bKash, Nagad, Rocket, Bank, PayPal)
৩. পরিমাণ এবং ট্রানজেকশন ID দিন
৪. এজেন্ট একাউন্ট নম্বর দিন (আবশ্যক)
৫. "Submit Donation" বাটনে ক্লিক করুন

আপনার ডোনেশন ভেরিফাই হলে আপনি একটি নোটিফিকেশন পাবেন।`,
    },
    {
      question: '🎫 সাপোর্ট টিকেট কিভাবে খুলবো?',
      answer: `১. নেভিগেশনে "Support" লিঙ্কে ক্লিক করুন
২. "Create New Ticket" বাটনে ক্লিক করুন
৩. সমস্যার বিষয়বস্তু এবং বিস্তারিত বার্তা দিন
৪. টিকেট সাবমিট করুন

এডমিনরা আপনার টিকেট দেখবে এবং যত দ্রুত সম্ভব উত্তর দেবে।`,
    },
    {
      question: '📍 GPS ট্র্যাকিং কিভাবে কাজ করে?',
      answer: `GPS ট্র্যাকিং ফিচার আপনাকে আপনার পোষা প্রাণীর অবস্থান ট্র্যাক করতে সাহায্য করে।

যদি আপনার পোষা প্রাণী হারিয়ে যায়:
১. "Mark as Lost" অপশন ব্যবহার করুন
২. হারিয়ে যাওয়ার অবস্থান সেট করুন
৩. প্ল্যাটফর্মে একটি লস্ট অ্যালার্ট তৈরি হবে
৪. আশেপাশের ব্যবহারকারীরা নোটিফিকেশন পাবে

এই ফিচারটি আপনার পোষা প্রাণী খুঁজে পেতে সাহায্য করবে।`,
    },
    {
      question: '🔔 নোটিফিকেশন কিভাবে কাজ করে?',
      answer: `আপনি নিম্নলিখিত ইভেন্টে নোটিফিকেশন পাবেন:

• কেউ আপনার হারানো পোষা প্রাণী খুঁজে পেলে
• আপনার পোষা প্রাণীর ভ্যাকসিনের তারিখ আসলে
• আপনার ডোনেশন ভেরিফাই হলে
• সাপোর্ট টিকেটে নতুন বার্তা আসলে
• অর্ডার স্ট্যাটাস পরিবর্তন হলে

নোটিফিকেশন দেখতে "Notifications" আইকনে ক্লিক করুন।`,
    },
  ],
  en: [
    {
      question: '🐾 What should I do first if my cat goes missing?',
      answer: `Inform nearby security guards, caretakers, doormen, and road watchmen immediately.
Show them a clear photo of your cat and share your phone number so they can contact you if they see the pet.
Mentioning a reward often increases attention and effort.`,
    },
    {
      question: '🐾 What if there is no security guard in nearby houses?',
      answer: `Visit nearby tin-shed houses or small buildings personally.
Ask residents directly using your pet's photo and leave your contact number.`,
    },
    {
      question: '🐾 Which places should I inform for better visibility?',
      answer: `Inform places where people gather frequently:

Tea stalls
Pharmacies
Grocery shops`,
    },
    {
      question: '🐾 How often should I search the area?',
      answer: `Search the area at least twice daily—
once in the morning and once in the evening.
Late night (10–11 PM) searches can be effective due to quiet surroundings.
Always ensure your personal safety.`,
    },
    {
      question: '🐾 How should I call my cat?',
      answer: `Call your cat by name.
Cats can recognize their owner's voice and scent even from a distance.`,
    },
    {
      question: '🐾 Where do lost cats usually hide?',
      answer: `Check areas where street cats gather:

Under-construction buildings
Parking areas
Near dustbins`,
    },
    {
      question: '🐾 Why should I inform waste collectors?',
      answer: `Sometimes cats accidentally enter houses and may be mistakenly taken away with garbage.
Inform waste collectors so they can notify you if they see any cat.`,
    },
    {
      question: '🐾 Is there any spiritual guidance to follow?',
      answer: `Islam teaches patience, hope, and kindness to animals.
While searching, remember Allah, make du'a, and remain hopeful.
Praying Tahajjud can bring peace to the heart and strength to continue.`,
    },
    {
      question: '🐾 Can social media help?',
      answer: `Yes. Post regularly with clear photos in:

Lost & Found Pet groups
Local area Facebook groups`,
    },
    {
      question: '🐾 Does leaving a litter box outside help?',
      answer: `Yes. Your cat may recognize its own scent and return home.`,
    },
    {
      question: '🐾 Should I check pet shops or markets?',
      answer: `Yes. Sometimes found cats are taken to pet shops or markets.
Checking these places can be helpful.`,
    },
    {
      question: '📱 How do I register my pet?',
      answer: `1. Log in and go to the "My Pets" section
2. Click the "Add New Pet" button
3. Enter your pet's information: name, type, breed, color, date of birth, etc.
4. Upload a photo of your pet
5. Click "Save"

After registration, a unique QR code will be generated for your pet.`,
    },
    {
      question: '🔲 How does the QR code work?',
      answer: `Each pet gets a unique QR code.

If someone finds your lost pet:
1. They scan the QR code
2. The QR code will show your contact information
3. They can contact you directly

If the QR code is attached to your pet's collar or tag, it makes it easy to find your pet if they get lost.`,
    },
    {
      question: '🏷️ How do I order a pet tag?',
      answer: `1. Go to your pet's profile
2. Click on "Order Pet Tag"
3. Select the tag color and size
4. Complete the order and make payment
5. Once the order is verified, the tag will be prepared

The tag will contain your pet's QR code, which can be easily scanned if your pet gets lost.`,
    },
    {
      question: '💉 How do I add vaccine records?',
      answer: `1. Go to your pet's profile
2. Navigate to the "Vaccine Info" section
3. Click the "Add Vaccine" button
4. Enter the vaccine name, date, clinic name, etc.
5. Upload a prescription image (if available)
6. Click "Save"

Keeping vaccine records helps you remember when the next vaccine is due.`,
    },
    {
      question: '🔍 What should someone do if they find my pet?',
      answer: `If your pet has a QR code:
1. Scan the QR code
2. They will see the owner's contact information
3. They can contact the owner directly

If there's no QR code:
1. Go to the "Report Found Pet" section
2. Provide the found pet's photo and location
3. It will be posted on the platform and the owner can find it`,
    },
    {
      question: '💝 How do I make a donation?',
      answer: `1. Click the "Donate" link in the navigation
2. Select a payment method (bKash, Nagad, Rocket, Bank, PayPal)
3. Enter the amount and transaction ID
4. Enter the agent account number (required)
5. Click "Submit Donation"

You will receive a notification once your donation is verified.`,
    },
    {
      question: '🎫 How do I open a support ticket?',
      answer: `1. Click the "Support" link in the navigation
2. Click the "Create New Ticket" button
3. Enter the subject and detailed message about your issue
4. Submit the ticket

Admins will review your ticket and respond as soon as possible.`,
    },
    {
      question: '📍 How does GPS tracking work?',
      answer: `The GPS tracking feature helps you track your pet's location.

If your pet goes missing:
1. Use the "Mark as Lost" option
2. Set the location where they were lost
3. A lost alert will be created on the platform
4. Nearby users will receive notifications

This feature helps you find your pet more easily.`,
    },
    {
      question: '🔔 How do notifications work?',
      answer: `You will receive notifications for the following events:

• When someone finds your lost pet
• When your pet's vaccine date is approaching
• When your donation is verified
• When you receive a new message on a support ticket
• When your order status changes

Click the "Notifications" icon to view your notifications.`,
    },
    {
      question: '🔐 How do I create an account?',
      answer: `1. Click "Login" in the navigation
2. Select "Sign in with Google"
3. Authorize the application with your Google account
4. Your account will be created automatically

You can then start registering your pets and using all platform features.`,
    },
    {
      question: '📸 How many photos can I upload for my pet?',
      answer: `You can upload multiple photos for each pet. This helps others identify your pet if they get lost.

To add more photos:
1. Go to your pet's profile
2. Click "Add Photo" or "Manage Photos"
3. Upload images from your device
4. Photos will be stored securely and displayed on your pet's profile`,
    },
    {
      question: '🔄 Can I transfer pet ownership?',
      answer: `Yes, you can transfer pet ownership if you need to give your pet to someone else.

1. Go to your pet's profile
2. Look for the "Transfer Ownership" option
3. Enter the new owner's email
4. Confirm the transfer

The ownership history will be recorded, and the new owner will receive a notification.`,
    },
  ],
};

export default function FAQPage() {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentFAQs = faqData[language];
  const title = language === 'bn' ? 'সাধারণ জিজ্ঞাসা – বিড়াল হারিয়ে গেলে করণীয়' : 'FAQ – If Your Pet (Cat) Goes Missing';

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'));
    setOpenIndex(null); // Close any open FAQ when switching language
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            {language === 'bn' ? '❓ সাধারণ জিজ্ঞাসা' : '❓ FAQ'}
          </h1>
          <p className="text-lg sm:text-xl text-cyan-200 mb-6">
            {title}
          </p>
          
          {/* Language Toggle */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={toggleLanguage}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border-2 border-cyan-400/50 rounded-lg hover:border-cyan-400 transition-all duration-300 flex items-center gap-2 text-cyan-200 hover:text-white font-medium shadow-lg hover:shadow-xl"
              aria-label={language === 'bn' ? 'Switch to English' : 'Switch to Bangla'}
            >
              <span className="text-lg">
                {language === 'bn' ? '🇧🇩' : '🇬🇧'}
              </span>
              <span>{language === 'bn' ? 'EN' : 'BN'}</span>
              <svg
                className="w-5 h-5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {currentFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-xl border border-pink-500/30 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-pink-400 rounded-xl"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-base sm:text-lg font-semibold text-cyan-200 flex-1">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-pink-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-4 pt-2">
                  <div className="text-sm sm:text-base text-cyan-100 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:from-cyan-600 hover:to-pink-600 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] font-medium text-lg"
          >
            {language === 'bn' ? '🏠 হোমে ফিরুন' : '🏠 Back to Home'}
          </Link>
        </div>
      </div>
    </main>
  );
}

