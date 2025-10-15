# Robotics Showcase Placeholder

A single-page React/Vite playground that lets you preview motion-heavy robotics storytelling with placeholder assets. It includes:

- A 3D hero header with subtle motion.
- An interactive model sandbox with hotspots and a wireframe toggle.
- A 2D inverse-kinematics playground (FABRIK solver) with adjustable parameters.
- A scroll-driven story section with a sticky Three.js canvas that reacts to the current step.
- All Three.js scenes are wired directly (no react-three-fiber dependency) so you can run the demo even in restricted package registries.

Everything ships with placeholder copy, visuals, and CTA buttons so you can iterate on layout, narrative, and interactivity before wiring up real data.

## Getting started

```bash
npm install
npm run dev
```

If the default npm registry is unavailable, point npm to another mirror and reinstall:

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

Then open the printed local URL to explore the placeholder experience.
