/** What a locked part of the app says to a guest: what it is, and why to make an account. */
export type JoinCopy = { title: string; text: string };

export const JOIN = {
  wallet: {
    title: 'Your wallet',
    text: 'Points, stamps and rewards for every order and pop-up. Make an account to start collecting.',
  },
  stamps: {
    title: 'Collect stamps',
    text: 'Every order and pop-up earns points toward free food. Make an account to start.',
  },
  achievements: {
    title: 'Badges and leaderboard',
    text: 'Earn badges at pop-ups and see where you rank each week. Make an account to join in.',
  },
  account: {
    title: 'Make it yours',
    text: 'With an account you can order ahead, collect points and badges, and add your name and photo.',
  },
  order: {
    title: 'Make an account to order',
    text: 'Order ahead and pick up without the queue. Every order earns points too.',
  },
  orders: {
    title: 'Your orders',
    text: 'The orders you place show up here. Make an account to order ahead.',
  },
  checkIn: {
    title: 'Make an account to check in',
    text: 'Check in at a pop-up to earn points and take on its challenges.',
  },
  challenges: {
    title: 'Challenges',
    text: 'Take on a pop-up’s challenges for points. Make an account to play.',
  },
  profile: {
    title: 'Your profile',
    text: 'Add your name and photo once you have an account.',
  },
  password: {
    title: 'No password yet',
    text: 'A guest has no password. Make an account to set one.',
  },
} satisfies Record<string, JoinCopy>;
