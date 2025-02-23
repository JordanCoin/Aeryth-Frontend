export const COMMANDS = {
  extract: {
    prefix: 'extract',
    description: 'Scan content for tasks using Task Radar',
    usage: 'extract <type> <content>',
    examples: [
      'extract git "feat: implement user auth"',
      'extract code "// TODO: add error handling"',
    ],
  },
  help: {
    prefix: 'help',
    description: 'Show help information',
    usage: 'help [command]',
    examples: ['help', 'help extract'],
  },
  clear: {
    prefix: 'clear',
    description: 'Clear the terminal',
    usage: 'clear',
    examples: ['clear'],
  },
} as const;

export const FILE_TYPES = {
  git: {
    name: 'Git',
    extractPatterns: [/feat:\s*(.+)/, /fix:\s*(.+)/],
    icon: 'GitBranch',
  },
  code: {
    name: 'Code',
    extractPatterns: [/\/\/\s*TODO:\s*(.+)/, /\/\/\s*FIXME:\s*(.+)/],
    icon: 'FileCode',
  },
} as const; 