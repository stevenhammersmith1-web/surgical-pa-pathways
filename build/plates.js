// Source-of-truth for anatomy plates: image metadata + per-procedure assignment.
const gray = (n, title) => ({
  title,
  credit: `Gray's Anatomy (1918), fig. ${n}`,
  license: 'Public domain',
  url: `https://commons.wikimedia.org/wiki/File:Gray${n}.png`
});

const IMAGES = {
  g398: gray(398, 'Rectus abdominis & inferior epigastric vessels'),
  g1224: gray(1224, 'Abdominal viscera in situ'),
  g1226: gray(1226, 'Posterior projection of lung, pleura & kidneys'),
  g530: gray(530, 'Intercostal vessels & nerves (left hemithorax, from within)'),
  g505: gray(505, 'Great veins: brachiocephalic confluence & SVC'),
  g558: gray(558, 'Veins of the anterior neck'),
  g520: gray(520, 'Lateral neck: carotid sheath & SCM'),
  g235: gray(235, 'Right hip bone, external surface'),
  g574: gray(574, 'Superficial veins of the upper limb'),
  g413: gray(413, 'Cross-section, mid upper arm'),
  g1081: gray(1081, 'Lower rectum & anal canal, inner wall'),
  bl_hem: {
    title: 'Internal vs. external hemorrhoids',
    credit: 'Blausen.com staff (2014), “Medical gallery of Blausen Medical 2014,” WikiJournal of Medicine 1(2). Cropped.',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Blausen_0408_Hemorrhoids.png'
  },
  g534: gray(534, 'Superior mesenteric artery & its branches'),
  g536: gray(536, 'Arteries of the cecum & appendix'),
  g537: gray(537, 'Inferior mesenteric artery & its branches'),
  g1223: gray(1223, 'Surface projection of the colon'),
  g1227: gray(1227, 'Surface markings: inguinal canal & rings'),
  g392: gray(392, 'External oblique & superficial inguinal ring (cropped)'),
  g399: gray(399, 'Transverse section of the rectus sheath'),
  g397: gray(397, 'Posterior rectus sheath & linea alba'),
  seer_breast: {
    title: 'Sagittal section of the breast',
    credit: 'NCI SEER Training Modules (U.S. National Cancer Institute)',
    license: 'Public domain (U.S. Gov.)',
    url: 'https://commons.wikimedia.org/wiki/File:Illu_breast_anatomy.jpg'
  },
  nci_breast: {
    title: 'Breast lobes, ducts & lymphatic drainage',
    credit: 'Don Bliss, National Cancer Institute (NCI Visuals Online #9306). Cropped.',
    license: 'Public domain (U.S. Gov.)',
    url: 'https://commons.wikimedia.org/wiki/File:Breast_anatomy.jpg'
  }
};

// Per-procedure plates. `note` tells the reader what to look for, in current terminology.
const PLATES = {
  'paracentesis': [
    { img:'g398', note:'The inferior epigastric artery and vein climb the back of the rectus muscle and enter its sheath below the arcuate line (“linea semicircularis”). Staying lateral to the rectus in the LLQ keeps the needle clear of them.' },
    { img:'g1224', note:'Cecum sits in the right lower quadrant and the sigmoid (“sigmoid flexure”) in the left; the bladder is midline above the pubis, which is why it should be emptied before a midline approach.' }
  ],
  'thoracentesis': [
    { img:'g1226', note:'From behind, the pleural reflection (blue) runs about two rib spaces below the lung edge (purple). Below that lie the spleen and kidneys, the structures at risk when the needle goes too low.' },
    { img:'g530', note:'Each intercostal space carries its vein, artery and nerve along the lower border of the rib above. The view is from inside the chest. Because the bundle hugs the rib above, the needle passes over the upper edge of the rib below.' }
  ],
  'port-subclavian': [
    { img:'g505', note:'The two brachiocephalic (“innominate”) veins join to form the SVC, with the left one crossing in front of the aortic arch branches. Each forms behind its sternoclavicular joint from the subclavian and internal jugular veins, which are cut short here. The pleura drapes closely over the thoracic inlet.' },
    { img:'g558', note:'The label at the bottom marks the subclavian vein passing behind the medial clavicle. The artery, not drawn here, lies behind it, separated by the anterior scalene. The pocket goes in the upper pectoral region below.' }
  ],
  'port-ij': [
    { img:'g558', note:'The internal jugular runs under the sternocleidomastoid down to its junction with the subclavian vein behind the clavicle. The muscle is left intact on the right of the figure and removed on the left to expose the vein.' },
    { img:'g520', note:'Lateral view with the sternocleidomastoid reflected. The internal jugular vein (blue) lies lateral to the carotid artery (red) in the carotid sheath, with the vagus nerve between and behind them.' }
  ],
  'bone-marrow-biopsy': [
    { img:'g235', note:'The posterior superior iliac spine is labelled at the left. The needle enters there and is aimed toward the anterior superior spine. Red dotted lines are muscle attachments, not vessels; the greater sciatic notch below is the zone to avoid.' }
  ],
  'midline-catheter': [
    { img:'g574', note:'Basilic vein on the medial arm and cephalic vein on the lateral, joined at the elbow by the median cubital vein. Midlines go into the upper-arm basilic, above the antecubital fossa.' },
    { img:'g413', note:'The ultrasound view: the brachial artery sits between its paired veins (the “Mickey Mouse” sign) next to the median nerve, while the basilic vein lies alone and more medial. Anterior is at the top.' }
  ],
  'thrombosed-hemorrhoidectomy': [
    { img:'g1081', note:'The dentate (pectinate) line runs at the level of the anal valves (“valves of Morgagni”). External hemorrhoidal veins lie below it under skin, which gives them somatic sensation. “Hilton’s white line” is the intersphincteric groove, below the dentate line.' },
    { img:'bl_hem', note:'Internal hemorrhoids arise above the dentate line; external hemorrhoids sit at the anal verge beneath skin, which is why a thrombosed external hemorrhoid is so painful.' }
  ],
  'right-colectomy': [
    { img:'g534', note:'The SMA runs down the centre. On the right, from lowest to highest, are the ileocolic (to the cecum), right colic (to the ascending colon) and middle colic (arching to the transverse colon) arteries. The SMA emerges from behind the pancreas (dotted) and crosses in front of the third part of the duodenum.' },
    { img:'g536', note:'Terminal ileocolic branches: cecal, appendicular and ileal. This is the vascular pedicle divided at its origin for an oncologic right colectomy.' }
  ],
  'left-colectomy': [
    { img:'g537', note:'The IMA leaves the aorta and gives off the left colic, sigmoid and superior rectal (“superior hemorrhoidal”) arteries. The middle colic (from the SMA) supplies the transverse colon above.' },
    { img:'g1223', note:'The splenic flexure sits high under the left ribs, above the hepatic flexure, which is why it needs a deliberate mobilization. “Iliac” and “pelvic colon” are old names for the descending–sigmoid junction and the sigmoid.' }
  ],
  'total-colectomy': [
    { img:'g1223', note:'The full colonic frame from cecum to sigmoid (“pelvic colon”), projected on the abdominal wall. Both flexures sit high, the splenic higher than the hepatic.' },
    { img:'g534', note:'SMA territory: ileocolic, right colic and middle colic arteries.' },
    { img:'g537', note:'IMA territory: left colic, sigmoid and superior rectal arteries.' }
  ],
  'inguinal-hernia': [
    { img:'g1227', note:'The inguinal canal runs from the deep (“abdominal”) ring to the superficial (“subcutaneous”) ring. The inferior epigastric artery passes just medial to the deep ring: indirect hernias come out lateral to it, direct hernias through Hesselbach’s triangle medial to it.' },
    { img:'g392', note:'The external oblique aponeurosis and superficial inguinal ring just above the pubis. This is the layer opened in a Lichtenstein repair. The ilioinguinal and iliohypogastric nerves are not shown in these plates.' }
  ],
  'ventral-hernia': [
    { img:'g399', note:'Section above the arcuate line: each rectus lies in its sheath, the sheaths meet at the linea alba, and transversalis fascia and peritoneum lie beneath. A retrorectus (Rives-Stoppa) mesh sits between the rectus and the posterior sheath.' },
    { img:'g397', note:'With the rectus drawn aside, the posterior layer of its sheath and the linea alba are exposed. The sheath’s posterior wall stops at the arcuate line, below the level of the umbilicus.' }
  ],
  'breast-excision': [
    { img:'seer_breast', note:'Lobules and ducts converge on the nipple, surrounded by fat, all lying on the pectoralis fascia and chest wall. The retromammary space is the plane between breast and pectoralis. Cooper’s ligaments are not drawn here.' },
    { img:'nci_breast', note:'Lobes, lobules and ducts, Most lymph from the breast drains laterally to the axillary nodes.' }
  ]
};

module.exports = { IMAGES, PLATES };
