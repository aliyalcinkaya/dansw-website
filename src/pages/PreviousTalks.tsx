import { useState } from 'react';

// Available tags for filtering
const allTags = [
  'Adobe Analytics',
  'AI',
  'Attribution',
  'Big Data',
  'Data Culture',
  'Data Implementation',
  'Data Integration',
  'Data Layer',
  'Data Modelling',
  'Data Privacy',
  'Data Science',
  'Data Visualisation',
  'DBT',
  'Google Analytics',
  'Google BigQuery',
  'Hadoop',
  'R',
  'SQL',
  'Tableau',
  'Web Analytics',
];

// Sample data - this would come from a CMS or API in production
const talks = [
  {
    id: 1,
    title: 'Building Data-Driven Culture at Scale',
    speaker: 'Jane Smith',
    company: 'Tech Corp',
    date: 'November 2024',
    description: 'How to foster a data-driven mindset across large organizations and overcome common challenges.',
    tags: ['Data Culture', 'Big Data'],
    videoUrl: '#',
  },
  {
    id: 2,
    title: 'Advanced Attribution Modeling',
    speaker: 'John Doe',
    company: 'Analytics Inc',
    date: 'October 2024',
    description: 'Deep dive into multi-touch attribution and how to implement it effectively for your marketing efforts.',
    tags: ['Attribution', 'Google Analytics'],
    videoUrl: '#',
  },
  {
    id: 3,
    title: 'Privacy-First Analytics',
    speaker: 'Sarah Johnson',
    company: 'Privacy Co',
    date: 'September 2024',
    description: 'Navigating the cookieless future and maintaining measurement capabilities while respecting user privacy.',
    tags: ['Data Privacy', 'Web Analytics'],
    videoUrl: '#',
  },
  {
    id: 4,
    title: 'Real-Time Data Pipelines with BigQuery',
    speaker: 'Mike Chen',
    company: 'DataFlow',
    date: 'August 2024',
    description: 'Architecture patterns for building reliable real-time data pipelines at scale using Google BigQuery.',
    tags: ['Google BigQuery', 'Data Integration', 'SQL'],
    videoUrl: '#',
  },
  {
    id: 5,
    title: 'ML in Production: Lessons Learned',
    speaker: 'Emily Davis',
    company: 'AI Solutions',
    date: 'July 2024',
    description: 'Practical insights from deploying machine learning models in production environments.',
    tags: ['AI', 'Data Science'],
    videoUrl: '#',
  },
  {
    id: 6,
    title: 'The Future of Web Analytics',
    speaker: 'Tom Wilson',
    company: 'Web Analytics Pro',
    date: 'June 2024',
    description: 'Exploring emerging trends and technologies shaping the future of web analytics.',
    tags: ['Web Analytics', 'Google Analytics'],
    videoUrl: '#',
  },
  {
    id: 7,
    title: 'Data Visualization Best Practices',
    speaker: 'Lisa Park',
    company: 'Viz Studio',
    date: 'May 2024',
    description: 'Creating compelling and insightful data visualizations that drive decision making.',
    tags: ['Data Visualisation', 'Tableau'],
    videoUrl: '#',
  },
  {
    id: 8,
    title: 'Implementing a Data Layer',
    speaker: 'Chris Brown',
    company: 'Tag Manager Experts',
    date: 'April 2024',
    description: 'Best practices for implementing a robust data layer for your analytics stack.',
    tags: ['Data Layer', 'Data Implementation', 'Google Analytics'],
    videoUrl: '#',
  },
  {
    id: 9,
    title: 'Adobe Analytics Deep Dive',
    speaker: 'Amanda Lee',
    company: 'Digital Analytics Co',
    date: 'March 2024',
    description: 'Advanced techniques and tips for getting the most out of Adobe Analytics.',
    tags: ['Adobe Analytics', 'Web Analytics'],
    videoUrl: '#',
  },
  {
    id: 10,
    title: 'Data Modelling with DBT',
    speaker: 'Ryan Murphy',
    company: 'Modern Data Stack',
    date: 'February 2024',
    description: 'Transform your raw data into analytics-ready datasets using DBT.',
    tags: ['DBT', 'Data Modelling', 'SQL'],
    videoUrl: '#',
  },
  {
    id: 11,
    title: 'Statistical Analysis with R',
    speaker: 'Dr. Kate Williams',
    company: 'Data Research Lab',
    date: 'January 2024',
    description: 'Using R for advanced statistical analysis and data exploration.',
    tags: ['R', 'Data Science'],
    videoUrl: '#',
  },
  {
    id: 12,
    title: 'Big Data with Hadoop',
    speaker: 'James Taylor',
    company: 'Enterprise Data',
    date: 'December 2023',
    description: 'Processing and analyzing large-scale datasets with Hadoop ecosystem.',
    tags: ['Hadoop', 'Big Data'],
    videoUrl: '#',
  },
];

export function PreviousTalks() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTalks = talks.filter(talk => {
    const matchesTag = !selectedTag || talk.tags.includes(selectedTag);
    const matchesSearch = !searchQuery || 
      talk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talk.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talk.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
              Knowledge Archive
            </span>
            <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-6">
              Previous Talks
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Explore insights from our community's brightest minds. 
              From technical deep-dives to strategic perspectives, find talks that inspire and inform.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search talks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedTag 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTag === tag 
                      ? 'bg-[var(--color-accent)] text-white' 
                      : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Talks Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {filteredTalks.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTalks.map((talk, index) => (
                <article
                  key={talk.id}
                  className="group bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Colored header */}
                  <div className="h-2 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-chart-2)] to-[var(--color-chart-3)]"></div>
                  
                  <div className="p-6">
                    {/* Date */}
                    <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                      {talk.date}
                    </span>
                    
                    {/* Title */}
                    <h3 className="text-xl text-[var(--color-primary)] mt-2 mb-3 group-hover:text-[var(--color-accent)] transition-colors">
                      {talk.title}
                    </h3>
                    
                    {/* Speaker */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-chart-2)] flex items-center justify-center text-white font-semibold text-sm">
                        {talk.speaker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{talk.speaker}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{talk.company}</p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
                      {talk.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {talk.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-md bg-[var(--color-surface-alt)] text-xs text-[var(--color-text-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Action */}
                    <button className="w-full py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Watch Recording
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-[var(--color-border)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl text-[var(--color-primary)] mb-2">No talks found</h3>
              <p className="text-[var(--color-text-muted)]">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-white border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl text-[var(--color-primary)] mb-4">
            Have a story to share?
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            We're always looking for speakers to share their experiences and insights with our community.
          </p>
          <a
            href="/become-a-speaker"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
          >
            Submit a Talk Proposal
          </a>
        </div>
      </section>
    </div>
  );
}

