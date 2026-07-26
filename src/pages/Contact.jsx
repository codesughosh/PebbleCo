import { Instagram, Mail, MessageCircle } from "lucide-react";

function Contact() {
  return (
    <div className="policy-page contact-page">
      <span className="info-kicker">Support</span>
      <h1>Contact Us</h1>

      <p>
        If you have any questions, feedback, or concerns, feel free to reach out
        to us.
      </p>

      <div className="contact-card">
        <div className="contact-icon">
          <Mail size={20} strokeWidth={1.8} />
        </div>
        <div>
          <span>Email</span>
          <a className="tap-feedback" href="mailto:pebbleco.team@gmail.com">
            pebbleco.team@gmail.com
          </a>
        </div>
      </div>

      <div className="contact-card">
        <div className="contact-icon">
          <Instagram size={20} strokeWidth={1.8} />
        </div>
        <div>
          <span>Instagram</span>
          <a
            className="tap-feedback"
            href="https://www.instagram.com/pebbleco.store"
            target="_blank"
            rel="noopener noreferrer"
          >
            @pebbleco.store
          </a>
        </div>
      </div>

      <div className="contact-card">
        <div className="contact-icon">
          <MessageCircle size={20} strokeWidth={1.8} />
        </div>
        <div>
          <span>Response</span>
          <p>We usually reply as soon as possible.</p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
