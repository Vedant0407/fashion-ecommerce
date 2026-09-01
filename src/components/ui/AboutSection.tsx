"use client";

import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section className="about-section">

      <div className="about-column">
        <h3>Connect with us</h3>
        <p>Call</p>
        <p>Text (WhatsApp)</p>
        <p>Instagram</p>
        <p>YouTube</p>
        <p>LinkedIn</p>
      </div>

      <div className="about-column">
        <h3>Order Support</h3>
        <p>Make a return/Exchange</p>
        <p>Refund/Exchange policy</p>
        <p>Track your order</p>
        <p>Shipping policy</p>
        <p>FAQ's</p>
        <p>Terms</p>
      </div>

      <div className="about-column">
        <h3>We are GreenO</h3>
        <p>Our story</p>
        <p>Walk-in Stores</p>
        <p>Collaborations</p>
        <p>Careers</p>
        <p>Media</p>
        <p>Blogs</p>
      </div>

      <div className="about-brand">
        <h2>GreenO</h2>
      </div>

      <div className="about-bag">
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
          className="bag-rotation"
        >
          <div className="shopping-bag">
            <div className="bag-handle" />
            <span>GreenO</span>
          </div>
        </motion.div>
      </div>

      <div className="about-copyright">
        © 2026 GREENO, ALL RIGHTS RESERVED
      </div>

    </section>
  );
}