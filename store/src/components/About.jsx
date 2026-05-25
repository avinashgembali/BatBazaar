import { useEffect, useRef } from 'react';
import '../styles/about.css';

const sections = [
  { cls: 'bat-sources', icon: '🏭', title: '1. Direct from the Source', text: "We believe in authenticity. That's why we source our bats directly from reputed factories and local bat manufacturers. By cutting out the middlemen, we ensure top-notch quality at the most affordable prices.", img: '/images/production.jpg', alt: 'cricket factory production image' },
  { cls: 'bat-test', icon: '🏏', title: '2. Tested by Cricketers', text: "Our team of passionate players doesn't just sell bats — we test them ourselves. Every bat goes through checks for stroke quality, balance, pickup, handle grip, and grain structure before it reaches you.", img: '/images/test.jpg', alt: 'Cricketer playing with the bat', reverse: true },
  { cls: 'bat-levels', icon: '📦', title: '3. Crafted for All Levels', text: "From street cricket to serious league matches, we've got something for everyone. Our collection includes Kashmir and English willow bats, catering to beginners, intermediate, and professional players alike.", img: '/images/bat.jpg', alt: 'showing all kinds of bats' },
  { cls: 'bat-passion', icon: '💬', title: '4. Driven by Passion', text: "BatBazaar isn't just a store — it's a community of cricket lovers. We're here to offer guidance, answer questions, and help you pick the perfect bat that feels just right in your hands. Because your next big shot deserves the right gear.", img: '/images/driven.jpg', alt: 'Cricketer hitting ball', reverse: true },
];

const About = () => {
  const refs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    refs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About BatBazaar</h1>
        <p>Bringing the finest cricket bats from the workshop to your hands.</p>
      </div>

      <div className="about-stats">
        <div className="about-stat"><strong>500+</strong><span>Bats Sold</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat"><strong>50+</strong><span>Brands</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat"><strong>4.8★</strong><span>Avg Rating</span></div>
        <div className="about-stat-divider" />
        <div className="about-stat"><strong>100%</strong><span>Authentic</span></div>
      </div>

      <div className="about-sections">
        {sections.map((s, i) => (
          <div
            key={s.cls}
            ref={el => refs.current[i] = el}
            className={`about-row reveal${s.reverse ? ' reverse' : ''}`}
          >
            <div className="about-text">
              <span className="about-icon">{s.icon}</span>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </div>
            <img src={s.img} alt={s.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
