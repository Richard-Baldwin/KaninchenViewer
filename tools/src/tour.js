// Guided tour steps. `asms` matches assembly base names ("Omni Wheel") or exact names ("Omni Wheel 1").
// `text` may be a function receiving { bodies, unique, count(regex), asms, total }.
const n = (v) => v.toLocaleString('en-US');

export const TOUR = [
  {
    title: 'Rabbitbot',
    text: (s) => `A compact omnidirectional soccer robot, modelled down to the last bearing ball: ${n(s.total)} bodies across ${s.asms} top-level assemblies.`,
    view: [1, 0.72, 1.35],
  },
  {
    title: 'Exploded view',
    explode: 1,
    text: 'Every assembly pulled apart along the direction it goes together. The explode slider in the toolbar does this at any time.',
    view: [1, 0.55, 1.35],
  },
  {
    title: 'Omni wheels',
    asms: ['Omni Wheel'],
    text: 'Four identical drive modules sit at 90° to each other, so the robot can drive in any direction and spin at the same time.',
    view: [0.2, 1.25, 1],
    pad: 1.1,
  },
  {
    title: 'Inside a wheel',
    asms: ['Omni Wheel 1'],
    explode: 1,
    text: (s) => `A Tarot 4008 outrunner with ${s.count(/^Magnet$/)} rotor magnets, a moteus 4.5 controller, an encoder magnet and ${s.count(/Dowel/)} subwheels spinning on ${s.count(/Flanged Ball Bearing/)} miniature flanged bearings.`,
    pad: 1.15,
  },
  {
    title: 'Solenoid kicker',
    asms: ['Solenoid Kicker'],
    text: 'Copper coil and steel slug held in a U-bracket, with a 3D-printed kicker head riding in two guides.',
  },
  {
    title: 'Kicker assembly',
    asms: ['Kicker Assembly'],
    text: 'Plunger stages with return springs on guide rods, a chipper plunger and a straight-kicker plate between front and back plates.',
  },
  {
    title: 'Dribbler',
    asms: ['Dribbler', 'Golf Ball'],
    text: 'Side plates, connectors and a motor holder carrying the dribbler motor, right at the mouth where the ball sits.',
    pad: 1.5,
  },
  {
    title: 'Compute & control',
    asms: ['Raspberry Pi 4 Model B', 'mjbots pi3hat r4.4', 'mjbots Power Distribution r4.3b'],
    explode: 0.45,
    text: 'A Raspberry Pi 4 with an mjbots pi3hat stacked on top talks to the wheel controllers over CAN-FD. The mjbots power distribution board feeds the motors.',
    pad: 1.2,
  },
  {
    title: 'Power',
    asms: ['Battery', 'Battery Holder', 'Capacitor'],
    text: 'The battery pack in its holder, plus a large capacitor (typically the energy store a solenoid kicker fires from).',
    pad: 1.35,
  },
  {
    title: 'Chassis',
    asms: ['Base Plate', 'Mid Plate', 'Lid', 'Shell'],
    explode: 1,
    text: 'Base plate, mid plate and lid stack on standoffs. The shell wraps everything and is held by two thumb nuts.',
    view: [1, 0.5, 1.4],
    pad: 1.05,
  },
  {
    title: 'Your turn',
    text: 'Click any part to inspect it, search the component list, or press S to cut a section and look inside.',
    view: [1, 0.72, 1.35],
  },
];
