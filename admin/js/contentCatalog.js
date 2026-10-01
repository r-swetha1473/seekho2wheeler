/** Human-readable CMS map. Internal page/slot keys stay in Google Sheets; Admin never needs them. */

function tf(slot, fields) {
  return { slot, fields };
}

function text(key, label, hint) {
  return { key, label, type: 'text', hint: hint || '' };
}

function url(key, label, hint) {
  return { key, label, type: 'url', hint: hint || '' };
}

function rich(key, label, hint, minHeight) {
  return { key, label, type: 'rich', hint: hint || '', minHeight: minHeight || '120px' };
}

export const CMS_PAGES = [
  {
    id: 'home',
    title: 'Home',
    blurb: 'The first page people see when they visit the website.',
    sections: [
      {
        id: 'hero',
        title: 'Hero banners',
        location: 'Home page → Top image slider',
        blurb: 'Large photos, headings and buttons at the very top of the Home page.',
        href: '#banners',
        hrefLabel: 'Open Banners'
      },
      {
        id: 'highlights',
        title: 'Highlight stats',
        location: 'Home page → Stat row under the banners',
        blurb: 'Short labels next to numbers such as students trained and Google rating. The numbers themselves are in Settings.',
        slots: [
          tf('highlight_students', [text('title', 'Students trained label', 'Shown under the student count.')]),
          tf('highlight_since', [text('title', 'Founded year label', 'Shown under the year (the year is in Settings).')]),
          tf('highlight_branches', [text('title', 'Branches label'), text('subtitle', 'Branches number text', 'Example: 4+')]),
          tf('highlight_rating', [text('title', 'Google rating label')]),
          tf('highlight_safety', [text('title', 'Safety label'), text('subtitle', 'Safety value', 'Example: 100%')]),
          tf('highlight_slots', [text('title', 'Flexible slots label'), text('subtitle', 'Hours text', 'Example: 7AM–7PM')])
        ]
      },
      {
        id: 'about',
        title: 'About introduction',
        location: 'Home page → About Us section',
        blurb: 'The About heading and short introduction above the three About cards.',
        slots: [
          tf('about_head', [
            text('subtitle', 'Small label above the heading', 'Example: About Us'),
            rich('title', 'Section heading', 'Main About heading on Home.'),
            rich('body_html', 'Introduction paragraph', 'Shown under the heading.')
          ])
        ]
      },
      {
        id: 'mission',
        title: 'Our Mission card',
        location: 'Home page → About → Mission card',
        blurb: 'The Mission card on the Home About grid.',
        slots: [
          tf('mission_card', [
            rich('title', 'Card heading'),
            rich('body_html', 'Card description', 'Longer Mission text. Full Mission page is under Detail Pages.')
          ])
        ]
      },
      {
        id: 'journey',
        title: 'Our Journey timeline',
        location: 'Home page → About → Journey card',
        blurb: 'Year labels and one-line stories on the Journey timeline.',
        slots: [
          tf('journey_card', [text('title', 'Card heading', 'Example: Our Journey')]),
          tf('journey_2018', [text('title', 'First year label'), text('subtitle', 'First year description')]),
          tf('journey_2020', [text('title', 'Second year label'), text('subtitle', 'Second year description')]),
          tf('journey_2023', [text('title', 'Third year label'), text('subtitle', 'Third year description')]),
          tf('journey_today', [text('title', 'Latest year label'), text('subtitle', 'Latest year description')])
        ]
      },
      {
        id: 'women_card',
        title: 'Women Empowerment card',
        location: 'Home page → About → Women card',
        blurb: 'The Women Empowerment card in the About grid.',
        slots: [
          tf('women_card', [rich('title', 'Card heading'), rich('body_html', 'Card description')])
        ]
      },
      {
        id: 'why',
        title: 'Why Choose Seekho',
        location: 'Home page → Why Choose section',
        blurb: 'Heading and reason cards in Why Choose Seekho.',
        href: '#why-choose',
        hrefLabel: 'Open Why Choose'
      },
      {
        id: 'courses',
        title: 'Training programmes',
        location: 'Home page → Courses & pricing cards',
        blurb: 'Heading above the course cards. Prices and course details are in Courses.',
        slots: [
          tf('courses_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description')
          ])
        ],
        extraHref: '#pricing',
        extraHrefLabel: 'Open Courses'
      },
      {
        id: 'doorstep',
        title: 'Doorstep training',
        location: 'Home page → Doorstep section',
        blurb: 'Service cards on Home (expand for details) plus the price checker labels. Edit the cards in Doorstep Section.',
        slots: [
          tf('doorstep_widget', [
            text('title', 'Price checker heading'),
            text('subtitle', 'Price checker hint'),
            text('body_html', 'Distance field label')
          ])
        ],
        extraHref: '#doorstep-section',
        extraHrefLabel: 'Open Doorstep Section'
      },
      {
        id: 'women',
        title: 'Women empowerment band',
        location: 'Home page → Freedom Begins section',
        blurb: 'Wide women-focused section with a list and booking button.',
        slots: [
          tf('women_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Section description'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ]),
          tf('women_l1', [text('title', 'List item 1')]),
          tf('women_l2', [text('title', 'List item 2')]),
          tf('women_l3', [text('title', 'List item 3')]),
          tf('women_l4', [text('title', 'List item 4')])
        ]
      },
      {
        id: 'gallery',
        title: 'Gallery preview',
        location: 'Home page → Gallery',
        blurb: 'Heading and button above the photo grid. Photos are in Gallery.',
        slots: [
          tf('gallery_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ])
        ],
        extraHref: '#gallery',
        extraHrefLabel: 'Open Gallery'
      },
      {
        id: 'reviews',
        title: 'Reviews preview',
        location: 'Home page → What Our Riders Say',
        blurb: 'Headings, rating labels and the “read all” button. Individual reviews are in Testimonials.',
        slots: [
          tf('reviews_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ]),
          tf('label_google_reviews', [text('title', 'Google reviews label')]),
          tf('label_facebook_reviews', [text('title', 'Facebook reviews label')]),
          tf('label_happy_students', [text('title', 'Happy students label')])
        ],
        extraHref: '#testimonials',
        extraHrefLabel: 'Open Testimonials'
      },
      {
        id: 'branches',
        title: 'Branches preview',
        location: 'Home page → Find a branch',
        blurb: 'Heading and “View all” button. Addresses are in Branches.',
        slots: [
          tf('branches_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description')
          ]),
          tf('branches_view', [text('title', 'View all button'), url('cta_link', 'View all link')]),
          tf('label_academy_location', [text('title', 'Academy location label')])
        ],
        extraHref: '#branches',
        extraHrefLabel: 'Open Branches'
      },
      {
        id: 'blog',
        title: 'Blog preview',
        location: 'Home page → Blog',
        blurb: 'Heading above article cards. Articles are in Blogs.',
        slots: [
          tf('blog_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ])
        ],
        extraHref: '#blogs',
        extraHrefLabel: 'Open Blogs'
      },
      {
        id: 'faq',
        title: 'FAQ preview',
        location: 'Home page → FAQ',
        blurb: 'Heading above the short FAQ list. Questions and answers are in FAQs.',
        slots: [
          tf('faq_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ])
        ],
        extraHref: '#faqs',
        extraHrefLabel: 'Open FAQs'
      },
      {
        id: 'contact',
        title: 'Contact strip',
        location: 'Home page → Get in touch',
        blurb: 'Headings and labels. Phone numbers, email and hours are in Settings.',
        slots: [
          tf('contact_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description')
          ]),
          tf('label_call', [text('title', 'Call label')]),
          tf('label_whatsapp', [text('title', 'WhatsApp label')]),
          tf('label_email', [text('title', 'Email label')]),
          tf('label_hours', [text('title', 'Hours label')]),
          tf('contact_submit', [text('title', 'Send button text')])
        ],
        extraHref: '#settings',
        extraHrefLabel: 'Open Settings'
      },
      {
        id: 'social',
        title: 'Social / follow us',
        location: 'Home page → Stay Connected',
        blurb: 'Heading above social links. Profile URLs are in Settings.',
        slots: [
          tf('social_head', [
            text('subtitle', 'Small label'),
            rich('title', 'Section heading'),
            rich('body_html', 'Short description')
          ])
        ]
      }
    ]
  },
  {
    id: 'about',
    title: 'About Us',
    blurb: 'The About page: story, mission and academy stats.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'About page → Top banner',
        blurb: 'Large heading and introduction at the top of About Us.',
        slots: [
          tf('hero', [
            rich('title', 'Page heading'),
            rich('subtitle', 'Introduction under the heading')
          ])
        ]
      },
      {
        id: 'mission',
        title: 'Our Mission',
        location: 'About page → Mission card',
        blurb: 'Mission heading, text and small label. The full Mission article is in Detail Pages.',
        slots: [
          tf('mission', [
            rich('title', 'Heading'),
            rich('body_html', 'Mission text', '', '160px'),
            text('cta_text', 'Small button / label text')
          ])
        ],
        extraHref: '#details',
        extraHrefLabel: 'Open Detail Pages'
      },
      {
        id: 'story',
        title: 'Our Story',
        location: 'About page → Story card',
        blurb: 'Story heading and paragraph.',
        slots: [
          tf('story', [rich('title', 'Heading'), rich('body_html', 'Story text', '', '160px')])
        ]
      },
      {
        id: 'different',
        title: 'What makes us different',
        location: 'About page → Difference list',
        blurb: 'Section title and the three difference points.',
        slots: [
          tf('different', [text('title', 'Section heading')]),
          tf('diff_trainers', [text('title', 'First point heading'), text('subtitle', 'First point text')]),
          tf('diff_women', [text('title', 'Second point heading'), text('subtitle', 'Second point text')]),
          tf('diff_branches', [text('title', 'Third point heading'), text('subtitle', 'Third point text')])
        ]
      },
      {
        id: 'promise',
        title: 'Our Promise',
        location: 'About page → Promise card',
        blurb: 'Promise heading, text and booking button.',
        slots: [
          tf('promise', [
            rich('title', 'Heading'),
            rich('body_html', 'Promise text', '', '160px'),
            text('cta_text', 'Button text'),
            url('cta_link', 'Button link')
          ])
        ]
      },
      {
        id: 'numbers',
        title: 'By the numbers',
        location: 'About page → Stats row',
        blurb: 'Headings and labels. Student count and rating numbers are in Settings.',
        slots: [
          tf('numbers_head', [text('subtitle', 'Small label'), text('title', 'Section heading')]),
          tf('stat_students', [text('title', 'Students label')]),
          tf('stat_rating', [text('title', 'Rating label')]),
          tf('stat_branches', [text('title', 'Branches label'), text('subtitle', 'Branches value')]),
          tf('stat_courses', [text('title', 'Courses label'), text('subtitle', 'Courses value')]),
          tf('stat_safety', [text('title', 'Safety label'), text('subtitle', 'Safety value')])
        ]
      }
    ]
  },
  {
    id: 'courses',
    title: 'Training / Courses',
    blurb: 'The Courses page heading. Each course card is edited in Courses.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Courses page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'cards',
        title: 'Course cards & prices',
        location: 'Courses page → Course list',
        blurb: 'Names, prices, photos and class counts.',
        href: '#pricing',
        hrefLabel: 'Open Courses'
      }
    ]
  },
  {
    id: 'branches',
    title: 'Branches',
    blurb: 'Branch finder page heading. Addresses and maps are in Branches.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Branches page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'search',
        title: 'Search row button',
        location: 'Branches page → Search bar',
        slots: [
          tf('search_cta', [text('title', 'Button text'), url('cta_link', 'Button link')])
        ]
      },
      {
        id: 'list',
        title: 'Branch details',
        location: 'Branches page → Branch cards',
        href: '#branches',
        hrefLabel: 'Open Branches'
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact',
    blurb: 'Contact page labels. Phone, email and hours are in Settings.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Contact page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'info',
        title: 'Contact labels',
        location: 'Contact page → Left information column',
        blurb: 'Words like Phone and Hours. The actual numbers are in Settings.',
        slots: [
          tf('label_phone', [text('title', 'Phone label')]),
          tf('label_whatsapp', [text('title', 'WhatsApp label')]),
          tf('label_email', [text('title', 'Email label')]),
          tf('label_branches', [
            text('title', 'Branches label'),
            text('subtitle', 'Branch summary line'),
            text('cta_text', 'View branches button'),
            url('cta_link', 'View branches link')
          ]),
          tf('label_findus', [text('title', 'Find us label')]),
          tf('label_hours', [text('title', 'Hours label')]),
          tf('form_title', [text('title', 'Form heading'), text('cta_text', 'Send button text')])
        ],
        extraHref: '#settings',
        extraHrefLabel: 'Open Settings'
      }
    ]
  },
  {
    id: 'faq',
    title: 'FAQ',
    blurb: 'FAQ page heading. Questions and answers are in FAQs.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'FAQ page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'cta',
        title: 'Still have questions',
        location: 'FAQ page → Bottom buttons',
        slots: [
          tf('cta', [text('title', 'Message above the buttons'), text('cta_text', 'Contact button'), url('cta_link', 'Contact link')]),
          tf('cta_book', [text('title', 'Book button'), url('cta_link', 'Book link')])
        ]
      },
      {
        id: 'items',
        title: 'Questions & answers',
        location: 'FAQ page → Accordion list',
        href: '#faqs',
        hrefLabel: 'Open FAQs'
      }
    ]
  },
  {
    id: 'gallery',
    title: 'Gallery',
    blurb: 'Gallery page heading. Photos are in Gallery.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Gallery page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'photos',
        title: 'Photos',
        location: 'Gallery page → Photo grid',
        href: '#gallery',
        hrefLabel: 'Open Gallery'
      }
    ]
  },
  {
    id: 'blog',
    title: 'Blog',
    blurb: 'Blog listing heading. Articles are in Blogs.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Blog page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'loading',
        title: 'Loading message',
        location: 'Article page → While an article loads',
        slots: [tf('loading', [text('title', 'Loading text')])]
      },
      {
        id: 'articles',
        title: 'Articles',
        location: 'Blog page → Article cards',
        href: '#blogs',
        hrefLabel: 'Open Blogs'
      }
    ]
  },
  {
    id: 'reviews',
    title: 'Reviews',
    blurb: 'Reviews page heading. Student quotes are in Testimonials.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Reviews page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'labels',
        title: 'Rating labels',
        location: 'Reviews page → Rating badges',
        slots: [
          tf('label_google', [text('title', 'Google reviews label')]),
          tf('label_facebook', [text('title', 'Facebook reviews label')]),
          tf('label_students', [text('title', 'Happy students label')])
        ]
      },
      {
        id: 'quotes',
        title: 'Student reviews',
        location: 'Reviews page → Review cards',
        href: '#testimonials',
        hrefLabel: 'Open Testimonials'
      }
    ]
  },
  {
    id: 'booking',
    title: 'Register & Book',
    blurb: 'Booking wizard headings and buttons.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Booking page → Top banner',
        slots: [
          tf('hero', [rich('title', 'Page heading'), rich('subtitle', 'Introduction')])
        ]
      },
      {
        id: 'steps',
        title: 'Step titles',
        location: 'Booking page → Wizard',
        slots: [
          tf('tab_course', [text('title', 'Step 1 tab')]),
          tf('tab_branch', [text('title', 'Step 2 tab')]),
          tf('tab_date', [text('title', 'Step 3 tab')]),
          tf('tab_time', [text('title', 'Step 4 tab')]),
          tf('tab_submit', [text('title', 'Step 5 tab')]),
          tf('step1', [text('title', 'Step 1 heading'), text('subtitle', 'Step 1 description')]),
          tf('step2', [text('title', 'Step 2 heading'), text('subtitle', 'Step 2 description')]),
          tf('step3', [text('title', 'Step 3 heading'), text('subtitle', 'Step 3 description')]),
          tf('step4', [text('title', 'Step 4 heading'), text('subtitle', 'Step 4 description')]),
          tf('step5', [text('title', 'Step 5 heading'), text('cta_text', 'Confirm button')]),
          tf('nav_back', [text('title', 'Back button')]),
          tf('nav_next', [text('title', 'Continue button')]),
          tf('doorstep_widget', [
            text('title', 'Doorstep checker heading'),
            text('subtitle', 'Doorstep checker hint'),
            text('body_html', 'Distance field label')
          ])
        ]
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    blurb: 'Legal page heading and full policy text.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Privacy page → Top banner',
        slots: [tf('hero', [rich('title', 'Page heading'), text('subtitle', 'Date line')])]
      },
      {
        id: 'body',
        title: 'Policy text',
        location: 'Privacy page → Main article',
        slots: [tf('body', [rich('body_html', 'Full policy', 'Use headings and lists. Do not paste unsafe HTML.', '280px')])]
      }
    ]
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    blurb: 'Legal page heading and full terms text.',
    sections: [
      {
        id: 'hero',
        title: 'Page top',
        location: 'Terms page → Top banner',
        slots: [tf('hero', [rich('title', 'Page heading'), text('subtitle', 'Date line')])]
      },
      {
        id: 'body',
        title: 'Terms text',
        location: 'Terms page → Main article',
        slots: [tf('body', [rich('body_html', 'Full terms', 'Use headings and lists. Do not paste unsafe HTML.', '280px')])]
      }
    ]
  },
  {
    id: 'notfound',
    title: 'Page not found (404)',
    blurb: 'Message shown when a link is broken.',
    sections: [
      {
        id: 'hero',
        title: '404 message',
        location: '404 page',
        slots: [
          tf('hero', [
            rich('title', 'Heading'),
            rich('subtitle', 'Explanation'),
            text('cta_text', 'Home button text'),
            url('cta_link', 'Home button link')
          ]),
          tf('cta_courses', [text('title', 'Courses button'), url('cta_link', 'Courses link')]),
          tf('cta_contact', [text('title', 'Contact button'), url('cta_link', 'Contact link')])
        ]
      }
    ]
  },
  {
    id: 'layout',
    title: 'Header & Footer',
    blurb: 'Menus, footer columns and sticky buttons on every page. Phone numbers and the header booking button wording are also in Settings.',
    sections: [
      {
        id: 'nav',
        title: 'Main menu',
        location: 'Every page → Top menu',
        slots: [
          tf('nav_home', [text('title', 'Home')]),
          tf('nav_about', [text('title', 'About Us')]),
          tf('nav_courses', [text('title', 'Courses')]),
          tf('nav_branches', [text('title', 'Branches')]),
          tf('nav_gallery', [text('title', 'Gallery')]),
          tf('nav_blog', [text('title', 'Blog')]),
          tf('nav_reviews', [text('title', 'Reviews')]),
          tf('nav_contact', [text('title', 'Contact')])
        ]
      },
      {
        id: 'dropdown',
        title: 'Courses dropdown',
        location: 'Every page → Courses menu list',
        slots: [
          tf('nav_scooty', [text('title', 'Scooty Training')]),
          tf('nav_bike', [text('title', 'Bike Training')]),
          tf('nav_ladies', [text('title', 'Ladies Training')]),
          tf('nav_ev', [text('title', 'Electric Vehicle')]),
          tf('nav_road', [text('title', 'Road Practice')]),
          tf('nav_rto', [text('title', 'RTO Practice')])
        ]
      },
      {
        id: 'footer_cols',
        title: 'Footer column titles',
        location: 'Every page → Footer',
        slots: [
          tf('col_quick', [text('title', 'Quick links title')]),
          tf('col_courses', [text('title', 'Courses column title')]),
          tf('col_branches', [text('title', 'Branches column title')]),
          tf('col_contact', [text('title', 'Contact column title')]),
          tf('link_privacy', [text('title', 'Privacy link')]),
          tf('link_terms', [text('title', 'Terms link')]),
          tf('link_whatsapp', [text('title', 'WhatsApp link text')]),
          tf('link_maps', [text('title', 'Maps link text')])
        ]
      },
      {
        id: 'cta',
        title: 'Footer call-to-action',
        location: 'Every page → Band above the footer',
        blurb: 'The three trust phrases. The main heading and button can also be changed in Settings.',
        slots: [
          tf('footer_trust', [
            text('title', 'First trust phrase'),
            text('subtitle', 'Second trust phrase'),
            text('body_html', 'Third trust phrase')
          ])
        ],
        extraHref: '#settings',
        extraHrefLabel: 'Open Settings'
      },
      {
        id: 'sticky',
        title: 'Mobile sticky buttons',
        location: 'Phones → Bottom Call / WhatsApp / Book bar',
        slots: [
          tf('sticky_call', [text('title', 'Call button')]),
          tf('sticky_wa', [text('title', 'WhatsApp button')]),
          tf('sticky_book', [text('title', 'Book button')])
        ]
      }
    ]
  }
];

export function getPage(id) {
  return CMS_PAGES.find((p) => p.id === id) || null;
}

export function getSection(pageId, sectionId) {
  const page = getPage(pageId);
  if (!page) return null;
  return (page.sections || []).find((s) => s.id === sectionId) || null;
}

export function searchCatalog(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  CMS_PAGES.forEach((page) => {
    (page.sections || []).forEach((sec) => {
      const blob = [page.title, page.blurb, sec.title, sec.blurb, sec.location]
        .concat((sec.slots || []).flatMap((sl) => (sl.fields || []).map((f) => f.label)))
        .join(' ')
        .toLowerCase();
      if (blob.includes(q)) {
        hits.push({ pageId: page.id, pageTitle: page.title, sectionId: sec.id, sectionTitle: sec.title, location: sec.location || '' });
      }
    });
  });
  return hits;
}
