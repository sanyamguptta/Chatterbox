import { useState } from 'react';
import Layout from '../components/layout/Layout';
import styles from './RoadmapPage.module.scss';

// Hardcoded v1 roadmap data — can be moved to DB in v2
const roadmaps = {
  1: {
    label: '1st Year',
    intro: 'Foundation year. Focus on core CS concepts and your first language.',
    tracks: [
      {
        title: 'Programming Fundamentals',
        icon: '💻',
        items: [
          { topic: 'C Programming', desc: 'Variables, arrays, pointers, structs, file I/O', link: 'https://www.geeksforgeeks.org/c-programming-language/' },
          { topic: 'Python Basics', desc: 'Data types, loops, functions, OOP basics', link: 'https://python.org' },
          { topic: 'Problem Solving', desc: 'HackerRank easy problems, logic building', link: 'https://hackerrank.com' },
        ],
      },
      {
        title: 'Web Basics',
        icon: '🌐',
        items: [
          { topic: 'HTML5 & CSS3', desc: 'Build simple static websites', link: 'https://developer.mozilla.org' },
          { topic: 'Git & GitHub', desc: 'Version control, push your code', link: 'https://git-scm.com' },
        ],
      },
      {
        title: 'Mathematics',
        icon: '📐',
        items: [
          { topic: 'Discrete Math', desc: 'Sets, logic, graph theory basics' },
          { topic: 'Linear Algebra', desc: 'Vectors, matrices — essential for ML later' },
        ],
      },
    ],
  },
  2: {
    label: '2nd Year',
    intro: 'Build depth. Pick your specialization track. Start DSA seriously.',
    tracks: [
      {
        title: 'Data Structures & Algorithms',
        icon: '🧩',
        items: [
          { topic: 'Arrays, Strings, Linked Lists', desc: 'Core structures, must-know', link: 'https://leetcode.com' },
          { topic: 'Stacks, Queues, Trees', desc: 'Traversals, BFS/DFS', link: 'https://neetcode.io' },
          { topic: 'Sorting & Searching', desc: 'QuickSort, MergeSort, Binary Search', link: 'https://visualgo.net' },
          { topic: 'Recursion & Dynamic Programming', desc: 'Memoization, tabulation', link: 'https://cses.fi' },
        ],
      },
      {
        title: 'Web Development',
        icon: '🖥️',
        items: [
          { topic: 'JavaScript (ES6+)', desc: 'Promises, async/await, DOM manipulation', link: 'https://javascript.info' },
          { topic: 'React.js', desc: 'Components, state, hooks, routing', link: 'https://react.dev' },
          { topic: 'Node.js + Express', desc: 'REST APIs, middleware, file handling', link: 'https://expressjs.com' },
        ],
      },
      {
        title: 'Databases',
        icon: '🗄️',
        items: [
          { topic: 'SQL Fundamentals', desc: 'SELECT, JOINs, indexes, transactions', link: 'https://sqlzoo.net' },
          { topic: 'PostgreSQL', desc: 'Practical database design', link: 'https://postgresql.org' },
        ],
      },
    ],
  },
  3: {
    label: '3rd Year',
    intro: 'System design, internships, advanced projects. This year defines your placement outcome.',
    tracks: [
      {
        title: 'Advanced DSA',
        icon: '⚡',
        items: [
          { topic: 'Graphs & Shortest Paths', desc: 'Dijkstra, Bellman-Ford, Floyd-Warshall', link: 'https://cp-algorithms.com' },
          { topic: 'Tries, Segment Trees', desc: 'Advanced data structures for interviews', link: 'https://codeforces.com' },
          { topic: 'Greedy & Backtracking', desc: 'N-Queens, combinatorial problems' },
        ],
      },
      {
        title: 'System Design',
        icon: '🏗️',
        items: [
          { topic: 'Scalability Basics', desc: 'Load balancing, caching, CDN', link: 'https://github.com/donnemartin/system-design-primer' },
          { topic: 'Database Design', desc: 'Normalization, indexing, sharding' },
          { topic: 'Microservices', desc: 'REST vs GraphQL, API design patterns', link: 'https://microservices.io' },
        ],
      },
      {
        title: 'Placement Prep',
        icon: '🎯',
        items: [
          { topic: 'LeetCode Top 150', desc: 'Do all of these. No shortcuts.', link: 'https://leetcode.com/studyplan/top-interview-150/' },
          { topic: 'Mock Interviews', desc: 'Pramp, Interviewing.io', link: 'https://pramp.com' },
          { topic: 'Resume Building', desc: 'Projects > GPA on your resume' },
        ],
      },
    ],
  },
  4: {
    label: '4th Year',
    intro: 'Final lap. Specialize. Contribute to open source. Land your job.',
    tracks: [
      {
        title: 'Specialization Tracks',
        icon: '🎓',
        items: [
          { topic: 'Machine Learning', desc: 'Scikit-learn, PyTorch basics, Kaggle', link: 'https://kaggle.com' },
          { topic: 'DevOps & Cloud', desc: 'Docker, CI/CD, AWS/GCP basics', link: 'https://roadmap.sh/devops' },
          { topic: 'Mobile Dev', desc: 'React Native or Flutter', link: 'https://reactnative.dev' },
        ],
      },
      {
        title: 'Open Source & Portfolio',
        icon: '🌍',
        items: [
          { topic: 'Contribute to OSS', desc: 'Find good-first-issues on GitHub', link: 'https://github.com/explore' },
          { topic: 'Build a SaaS', desc: 'Ship something real with real users' },
          { topic: 'Technical Blog', desc: 'Write about what you build — Dev.to, Hashnode', link: 'https://dev.to' },
        ],
      },
      {
        title: 'Final Placement Push',
        icon: '🚀',
        items: [
          { topic: 'Full Interview Prep', desc: 'DSA + System Design + Behavioral', link: 'https://interviewing.io' },
          { topic: 'LinkedIn Optimization', desc: 'Profile + networking + recruiter reach' },
          { topic: 'Negotiate Your Offer', desc: 'Never accept the first offer', link: 'https://levels.fyi' },
        ],
      },
    ],
  },
};

export default function RoadmapPage() {
  const [activeYear, setActiveYear] = useState(1);
  const roadmap = roadmaps[activeYear];

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Developer Roadmaps</h1>
          <p className={styles.subhead}>Year-wise learning path for CSE/IT students. Start where you are.</p>
        </div>

        {/* Year tabs */}
        <div className={styles.yearTabs}>
          {Object.entries(roadmaps).map(([year, data]) => (
            <button
              key={year}
              className={`${styles.yearTab} ${Number(year) === activeYear ? styles.activeYear : ''}`}
              onClick={() => setActiveYear(Number(year))}
            >
              {data.label}
            </button>
          ))}
        </div>

        {/* Intro */}
        <div className={styles.intro}>{roadmap.intro}</div>

        {/* Tracks */}
        <div className={styles.tracks}>
          {roadmap.tracks.map((track, ti) => (
            <div key={ti} className={styles.track}>
              <div className={styles.trackHeader}>
                <span className={styles.trackIcon}>{track.icon}</span>
                <h2 className={styles.trackTitle}>{track.title}</h2>
              </div>
              <div className={styles.items}>
                {track.items.map((item, ii) => (
                  <div key={ii} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTopic}>{item.topic}</span>
                      <span className={styles.itemDesc}>{item.desc}</span>
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.itemLink}
                      >
                        Open →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
