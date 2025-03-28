"use client";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Compass, 
  BookOpen, 
  TrendingUp, 
  Code,
  Twitter,
  Bookmark, 
  Users, 
  Database, 
  Globe, 
  GraduationCap, 
  Wallet, 
  Trophy, 
  Github,
  BarChart3,
  MessageCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Feature card component
export function FeatureCard({ 
  icon, 
  title, 
  description,
  color = "bg-purple-500"
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}) {

  return (
    <motion.div 
    className="p-6 rounded-xl bg-gray-900/70 backdrop-blur-sm border border-white/5 h-full"
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}

    >
            <div className={`w-12 h-12 rounded-full ${color} bg-opacity-20 flex items-center justify-center mb-4`}>

        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>

      <p className="text-gray-400">{description}</p>
    </motion.div>
    );

}

// Stats card component
export function StatsCard({ 
  value, 
  label,
  icon = <BarChart3 className="w-6 h-6 text-purple-400" />
}: { 
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {

  return (
    <motion.div 
    className="p-6 rounded-xl bg-gray-900/70 backdrop-blur-sm border border-white/5 flex flex-col items-center"
    whileHover={{ y: -5 }}
  >
    <div className="w-12 h-12 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center mb-2">
      {icon}
    </div>
    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mt-2">
      {value}

      </div>
      <div className="text-gray-400 mt-1">{label}</div>

    </motion.div>
  );
}

// Timeline Item component
interface TimelineItemProps {
  date?: string;
  title: string;
  description: string;
  isLeft?: boolean;
  delay?: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ date, title, description, isLeft = false, delay = 0 }) => {
  return (
    <motion.div 
    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}

      viewport={{ once: true }}
      className={`relative flex flex-col md:flex-row items-center mb-12 ${isLeft ? 'md:flex-row-reverse' : ''}`}
      >
        <div className="md:w-1/2 mb-4 md:mb-0">
          <div className={`${isLeft ? 'md:ml-12' : 'md:mr-12'} glass p-6 rounded-xl`}>
            <div className="text-indigo-400 font-bold mb-2">{date}</div>
            <h4 className="text-xl font-bold mb-2">{title}</h4>
            <p className="text-gray-400">{description}</p>
          </div>
        </div>
            
        <div className="md:w-1/2 flex justify-center md:justify-start items-center">
        <div className="w-4 h-4 bg-indigo-500 rounded-full z-10"></div>

      </div>
    </motion.div>
  );
};

export function IntroSection() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-6 gradient-text"
        >
          Reimagining Education with Web3
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-gray-300 max-w-3xl mx-auto"
        >
          EduMint combines decentralized finance with education to create a revolutionary educational financial ecosystem.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<GraduationCap className="w-10 h-10 text-indigo-400" />}
          title="Learn-to-Earn"
          description="Get rewarded with EDU tokens for completing courses and improving your skills in the Web3 space."
        />
        <FeatureCard 
          icon={<Wallet className="w-10 h-10 text-indigo-400" />}
          title="Course Tokens"
          description="Each course has its own token which can be traded, staked, or used for governance within its ecosystem."
        />
        <FeatureCard 
          icon={<BookOpen className="w-10 h-10 text-indigo-400" />}
          title="Create & Earn"
          description="Educators can create courses and earn from sales, staking, and token appreciation."
        />
        <FeatureCard 
          icon={<BarChart3 className="w-10 h-10 text-indigo-400" />}
          title="Token Trading"
          description="Speculate on promising educational content by trading course tokens on our built-in exchange."
        />
        <FeatureCard 
          icon={<Users className="w-10 h-10 text-indigo-400" />}
          title="DAO Governance"
          description="Course quality and platform development are governed by EDU token holders."
        />
        <FeatureCard 
          icon={<Trophy className="w-10 h-10 text-indigo-400" />}
          title="Skill Certification"
          description="Earn NFT certificates that verify your skills and knowledge on the blockchain."
        />

      </div>
    </section>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 px-4 md:px-8 bg-black/30">
    <div className="max-w-7xl mx-auto">
      <motion.h2 

          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          //viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-16 text-center gradient-text"
        >
          EduMint in Numbers
        </motion.h2>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatsCard
            value="25+"
            label="Course Categories"

            icon={<BookOpen className="w-6 h-6 text-purple-400" />}
          />
                    <StatsCard
            value="10,000+"
            label="Active Learners"

            icon={<Users className="w-6 h-6 text-purple-400" />}
          />
                    <StatsCard
            value="500+"
            label="Course Creators"
            icon={<GraduationCap className="w-6 h-6 text-purple-400" />}

          />
                    <StatsCard
            value="$2.5M+"
            label="Total Value Locked"
            icon={<Wallet className="w-6 h-6 text-purple-400" />}

          />
        </div>
      
        <div className="mt-20">
          <div className="text-center mb-12">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold mb-4"
            >
              Our Journey
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-gray-400 max-w-2xl mx-auto"
            >
              From concept to reality, follow EduMint's growth story
            </motion.p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-indigo-900/50 transform md:translate-x-[-50%]"></div>
            
            <TimelineItem
              date="Q1 2023"
              title="Concept Development"
              description="EduMint begins as a vision to revolutionize education with Web3 technology"
              isLeft={true}
              delay={0}
            />
            <TimelineItem
              date="Q2 2023"
              title="Platform Development"
              description="Building the technology stack and smart contracts for the EduMint ecosystem"
              isLeft={false}
              delay={0.2}
            />
            <TimelineItem
              date="Q3 2023"
              title="Token Launch"
              description="EDU token launches with initial liquidity and governance capabilities"
              isLeft={true}
              delay={0.4}
            />
            <TimelineItem
              date="Q4 2023"
              title="Course Marketplace"
              description="First courses available for learning on EduMint, introducing Learn-to-Earn"
              isLeft={false}
              delay={0.6}
            />
            <TimelineItem
              date="Q1 2024"
              title="Mobile App Launch"
              description="Expanding access with mobile applications for iOS and Android"
              isLeft={true}
              delay={0.8}
            />
            <TimelineItem
              date="Q2 2024"
              title="Global Expansion"
              description="EduMint goes multilingual with courses in 10+ languages"
              isLeft={false}
              delay={1.0}
            />
          </div>
        </div>
        </div>
        </section>
        );
        }

export function Footer() {
  return (
    <footer className="py-16 px-4 md:px-8 bg-black/50">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          <div>
          <h3 className="font-bold text-2xl mb-4 flex items-center">
              <span className="gradient-text">EduMint</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Revolutionizing education through decentralized learning and tokenized knowledge.

            </p>
            <div className="flex space-x-4">
            <Link href="https://github.com" className="text-gray-400 hover:text-white transition-colors" target="_blank">
                <Github className="w-7 h-7" />

              </Link>
              <Link href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors" target="_blank">
                <Twitter className="w-7 h-7" />

              </Link>
              <Link href="https://discord.com" className="text-gray-400 hover:text-white transition-colors" target="_blank">

                <MessageCircle className="w-7 h-7" />
              </Link>
              <Link href="https://telegram.org" className="text-gray-400 hover:text-white transition-colors" target="_blank">

                <MessageCircle className="w-7 h-7" />
              </Link>
            </div>
          </div>
          <div>
          <h4 className="font-bold text-lg mb-4">Platform</h4>

            <ul className="space-y-2">
            <li><Link href="/learn" className="text-gray-400 hover:text-white transition-colors">Courses</Link></li>
              <li><Link href="/create" className="text-gray-400 hover:text-white transition-colors">Create</Link></li>
              <li><Link href="/trade" className="text-gray-400 hover:text-white transition-colors">Trade</Link></li>
              <li><Link href="/governance" className="text-gray-400 hover:text-white transition-colors">Governance</Link></li>

            </ul>
          </div>
          <div>
          <h4 className="font-bold text-lg mb-4">Resources</h4>

            <ul className="space-y-2">
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Smart Contracts</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Whitepaper</Link></li>

            </ul>
          </div>
          <div>
          <h4 className="font-bold text-lg mb-4">Contact</h4>

            <ul className="space-y-2">
            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Partnerships</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>

            </ul>
          </div>
        </div>
                
        <div className="mt-12 pt-8 border-t border-gray-800 text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>© 2024 EduMint. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>

        </div>
      </div>
      </footer>
  );

}

// export function TimelineSection() {
//   return (
//     <section className="py-24">
//       <div className="container px-4 md:px-6">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5 }}
//           className="text-center max-w-[800px] mx-auto mb-12"
//         >
//           <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
//             Our Journey
//           </h2>
//           <p className="text-gray-400">
//             Explore the key features and applications of our platform that create value for different stakeholders.
//           </p>
//         </motion.div>

//         <div className="relative">
//           <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-800"></div>
//           <div className="space-y-12 relative">
//             <TimelineItem
//               title="For Learners"
//               description="Access quality courses, earn rewards for completing learning tasks, generate passive income through staking course tokens, and participate in platform governance decisions."
//               isLeft={true}
//             />
//             <TimelineItem
//               title="For Educators"
//               description="Create and sell tokenized courses, receive direct economic returns, earn royalties from secondary market trading, and build personal brand and influence."
//               isLeft={false}
//               delay={0.1}
//             />
//             <TimelineItem
//               title="For Investors"
//               description="Invest in promising educational content, gain returns through course token appreciation, and provide liquidity to the education ecosystem to earn rewards."
//               isLeft={true}
//               delay={0.2}
//             />
//             <TimelineItem
//               title="For Educational Institutions"
//               description="Migrate existing courses to the blockchain platform, expand global influence, create new revenue streams through the token economy model, and increase student engagement."
//               isLeft={false}
//               delay={0.3}
//             />
//             <TimelineItem
//               title="For Corporate Training"
//               description="Provide professional training courses for employees, verify employee skills through on-chain certificates, and establish incentive mechanisms based on smart contracts for learning."
//               isLeft={true}
//               delay={0.4}
//             />
//             <TimelineItem
//               title="For Community Building"
//               description="Participate in platform governance, propose new features and improvements, discuss educational topics in forums, and establish connections and collaborations with like-minded individuals."
//               isLeft={false}
//               delay={0.5}
//             />
//           </div>
//         </div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//           className="mt-24 p-8 bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl"
//         >
//           <div className="grid gap-8 md:grid-cols-2 items-center">
//             <div>
//               <h3 className="text-2xl font-bold mb-4">Ready to Start Your Blockchain Education Journey?</h3>
//               <p className="text-gray-400 mb-6">
//                 Join the EduMint platform to experience the perfect combination of education and blockchain technology.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <Link
//                   href="/learn"
//                   className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
//                 >
//                   Start Learning
//                 </Link>
//                 <Link
//                   href="/create"
//                   className="bg-transparent hover:bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
//                 >
//                   Create Course
//                 </Link>
//               </div>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="bg-gray-800/50 p-4 rounded-lg text-center">
//                 <p className="text-2xl font-bold text-purple-400">500+</p>
//                 <p className="text-sm text-gray-400">Available Courses</p>
//               </div>
//               <div className="bg-gray-800/50 p-4 rounded-lg text-center">
//                 <p className="text-2xl font-bold text-purple-400">10K+</p>
//                 <p className="text-sm text-gray-400">Active Learners</p>
//               </div>
//               <div className="bg-gray-800/50 p-4 rounded-lg text-center">
//                 <p className="text-2xl font-bold text-purple-400">100+</p>
//                 <p className="text-sm text-gray-400">Certified Creators</p>
//               </div>
//               <div className="bg-gray-800/50 p-4 rounded-lg text-center">
//                 <p className="text-2xl font-bold text-purple-400">24/7</p>
//                 <p className="text-sm text-gray-400">Support</p>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   )
// } 