import React from 'react';
import '../styles/about.css'; // Assuming you have a CSS file for styling   

const About = () => {
  return (
    <>
      <h1>About Us</h1>
      <hr />

      <div className="bat-sources">
        <div className="source-content">
          <h2>🏭 1. Direct from the Source</h2>
          <p>
            We believe in authenticity. That’s why we source our bats directly 
            from reputed factories and local bat manufacturers. By cutting out the middlemen, 
            we ensure top-notch quality at the most affordable prices.
          </p>
        </div>
        <img src="/images/production.jpg" alt="cricket factory production image" loading="lazy" />
      </div>

      <hr />

      <div className="bat-test">
        <div className="test-content">
          <h2>🏏 2. Tested by Cricketers</h2>
          <p>
            Our team of passionate players doesn't just sell bats — 
            we test them ourselves. Every bat goes through checks for stroke quality, 
            balance, pickup, handle grip, and grain structure before it reaches you.
          </p>
        </div>
        <img src="/images/test.jpg" alt="Cricketer playing with the bat" loading="lazy" />
      </div>

      <hr />

      <div className="bat-levels">
        <div className="levels-content">
          <h2>📦 3. Crafted for All Levels</h2>
          <p>
            From street cricket to serious league matches, we’ve got something for everyone. 
            Our collection includes Kashmir and English willow bats, catering to beginners, 
            intermediate, and professional players alike.
          </p>
        </div>
        <img src="/images/bat.jpg" alt="showing all kinds of bats" loading="lazy" />
      </div>

      <hr />

      <div className="bat-passion">
        <div className="Passion-content">
          <h2>💬 4. Driven by Passion</h2>
          <p>
            BatBazaar isn’t just a store — it’s a community of cricket lovers. 
            We're here to offer guidance, answer questions, and help you pick 
            the perfect bat that feels just right in your hands. Because your 
            next big shot deserves the right gear.
          </p>
        </div>
        <img src="/images/driven.jpg" alt="Cricketer hitting ball" loading="lazy" />
      </div>

      <hr />
    </>
  );
};

export default About;
