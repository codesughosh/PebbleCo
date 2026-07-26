import { Gem, HeartHandshake, PackageCheck } from "lucide-react";

function About() {
  return (
    <div className="about-page">
      <div className="about-card">
        <span className="info-kicker">Our Story</span>
        <h1>About PebbleCo</h1>

        <p>
          PebbleCo is a student-led e-commerce brand creating minimal, cute, and
          affordable accessories. Every product is handmade with love, carefully
          packed, and shipped all over India.
        </p>

        <div className="about-points">
          <div className="about-point">
            <Gem size={20} strokeWidth={1.8} />
            <span>Minimal accessories</span>
          </div>
          <div className="about-point">
            <HeartHandshake size={20} strokeWidth={1.8} />
            <span>Handmade with care</span>
          </div>
          <div className="about-point">
            <PackageCheck size={20} strokeWidth={1.8} />
            <span>Packed with detail</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
