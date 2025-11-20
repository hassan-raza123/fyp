export default function ParallaxShowcaseSection() {
  return (
    <div
      className='relative bg-fixed bg-center bg-cover'
      style={{ backgroundImage: "url('/bg/Newroom-Summer-Graduation-2023.webp')" }}
    >
      <div className='bg-slate-900/80'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Text Content */}
            <div className='text-white'>
              <span className='inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-semibold mb-4'>
                IMMERSIVE EXPERIENCE
              </span>
              <h2 className='text-4xl sm:text-5xl font-bold leading-tight mb-6'>
                Learn Anytime,
                <span className='block text-brand-secondary-light'>Anywhere</span>
              </h2>
              <p className='text-lg text-indigo-100 mb-10 max-w-xl'>
                Interactive dashboards, real-time insights, and automated reports keep you connected to
                student progress even when you're on the move.
              </p>
            </div>

            {/* Glass Cards */}
            <div className='space-y-6'>
              {[
                {
                  title: 'Live Progress Tracking',
                  desc: 'Monitor CLO/PLO attainment with live dashboards',
                },
                {
                  title: 'Transparent Outcomes',
                  desc: 'Share progress updates with faculty and students',
                },
                {
                  title: 'Smart Alerts',
                  desc: 'Get notified about performance shifts instantly',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className='bg-white/15 border border-white/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-colors'
                >
                  <div className='text-sm font-semibold text-brand-secondary-light mb-2'>
                    0{idx + 1}
                  </div>
                  <h3 className='text-2xl font-bold text-white mb-2'>{item.title}</h3>
                  <p className='text-indigo-100 text-sm leading-relaxed'>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

