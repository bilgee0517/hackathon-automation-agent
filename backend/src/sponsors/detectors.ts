// Detection patterns for all 15 sponsors

export interface SponsorPattern {
  packages: string[];
  imports: string[];
  files: string[];
  keywords: string[];
  services?: string[];
}

export const SPONSOR_DETECTION_PATTERNS: Record<string, SponsorPattern> = {
  // ===== NEW SPONSORS =====
  
  liquidMetalAI: {
    packages: ['liquidmetal-ai', '@liquidmetal/sdk', 'liquidmetal'],
    imports: ['liquidmetal', '@liquidmetal'],
    files: [],
    keywords: ['liquidmetal', 'liquid metal', 'liquidmetal ai', 'ai platform']
  },
  
  fastinoLabs: {
    packages: ['fastino', '@fastino/sdk', 'fastino-labs'],
    imports: ['fastino', '@fastino'],
    files: [],
    keywords: ['fastino', 'fastino labs', 'fastino.io']
  },
  
  freepik: {
    packages: ['freepik-api', '@freepik/sdk', 'freepik'],
    imports: ['freepik', '@freepik'],
    files: [],
    keywords: ['freepik', 'image generation', 'graphic design', 'freepik api']
  },
  
  gladly: {
    packages: ['gladly-sdk', '@gladly/sdk', 'gladly'],
    imports: ['gladly', '@gladly'],
    files: [],
    keywords: ['gladly', 'customer service', 'support platform', 'gladly.com']
  },
  
  frontegg: {
    packages: ['@frontegg/react', '@frontegg/nextjs', '@frontegg/angular', 'frontegg'],
    imports: ['frontegg', '@frontegg'],
    files: ['frontegg.json'],
    keywords: ['frontegg', 'authentication', 'user management', 'auth platform']
  },
  
  googleDeepMind: {
    packages: ['google-generativeai', '@google/generative-ai', 'gemini-ai'],
    imports: ['generativeai', '@google/generative-ai', 'gemini'],
    files: [],
    keywords: ['gemini', 'deepmind', 'google ai', 'generative ai', 'palm', 'bard']
  },
  
  forethought: {
    packages: ['forethought-sdk', '@forethought/sdk'],
    imports: ['forethought', '@forethought'],
    files: [],
    keywords: ['forethought', 'solve api', 'ai support', 'customer support ai']
  },
  
  lovable: {
    packages: ['lovable-sdk', '@lovable/sdk', 'lovable'],
    imports: ['lovable', '@lovable'],
    files: [],
    keywords: ['lovable', 'lovable.ai', 'ai development', 'code generation']
  },
  
  airia: {
    packages: ['airia-sdk', '@airia/sdk', 'airia'],
    imports: ['airia', '@airia'],
    files: [],
    keywords: ['airia', 'ai platform', 'airia.ai']
  },
  
  campfire: {
    packages: ['campfire-sdk', '@campfire/sdk', 'campfire'],
    imports: ['campfire', '@campfire'],
    files: [],
    keywords: ['campfire', 'collaboration', 'team platform']
  },
  
  linkup: {
    packages: ['linkup-sdk', '@linkup/sdk', 'linkup'],
    imports: ['linkup', '@linkup'],
    files: [],
    keywords: ['linkup', 'web search', 'search api', 'linkup api']
  },
  
  daft: {
    packages: ['daft', 'getdaft', '@daft/sdk'],
    imports: ['daft', '@daft', 'getdaft'],
    files: [],
    keywords: ['daft', 'data processing', 'dataframes', 'distributed computing']
  },
  
  senso: {
    packages: ['senso-sdk', '@senso/sdk'],
    imports: ['senso', '@senso'],
    files: [],
    keywords: ['senso', 'data platform', 'senso.ai']
  },
  
  crosby: {
    packages: ['crosby-sdk', '@crosby/sdk', 'crosby'],
    imports: ['crosby', '@crosby'],
    files: [],
    keywords: ['crosby', 'ai platform', 'crosby.ai']
  },
  
  mcpTotal: {
    packages: ['mcp-total', '@mcp/total', 'mcp-sdk'],
    imports: ['mcp', '@mcp/total', 'mcp-total'],
    files: [],
    keywords: ['mcp', 'mcp total', 'model context protocol', 'mcp sdk']
  },
  
  // ===== OLD SPONSORS (COMMENTED OUT) =====
  /*
  aws: {
    packages: ['aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb', '@aws-sdk/client-lambda', 'boto3', 'aws-cdk', 'serverless'],
    imports: ['AWS.', 'aws-sdk', 'boto3', '@aws-sdk', 'aws-cdk'],
    files: ['serverless.yml', 'cdk.json', 'aws-exports.js', 'amplify'],
    keywords: ['AWS', 'amazon web services', 's3', 'lambda', 'dynamodb', 'ec2', 'cloudformation'],
    services: ['S3', 'Lambda', 'DynamoDB', 'EC2', 'CloudFront', 'RDS', 'SQS', 'SNS']
  },
  
  skyflow: {
    packages: ['skyflow-node', 'skyflow-js', '@skyflow/node'],
    imports: ['Skyflow', 'skyflow', 'from skyflow'],
    files: ['skyflow.config.js', 'skyflow.json'],
    keywords: ['vault', 'detokenize', 'tokenize', 'PII', 'skyflow', 'data privacy vault']
  },
  
  postman: {
    packages: ['newman', '@postman/newman', 'postman-collection'],
    imports: ['newman', '@postman/newman'],
    files: ['.postman_collection.json', 'postman_collection.json', 'postman_environment.json'],
    keywords: ['postman', 'newman', 'api collection', 'postman test', 'pm.test']
  },
  
  redis: {
    packages: ['redis', 'ioredis', 'node-redis', 'redis-py', 'connect-redis'],
    imports: ['createClient', 'Redis', 'ioredis', 'from redis'],
    files: ['redis.conf', 'docker-compose.yml'],
    keywords: ['cache', 'pub/sub', 'ZADD', 'HSET', 'LPUSH', 'redis', 'in-memory']
  },
  
  anthropic: {
    packages: ['@anthropic-ai/sdk', 'anthropic'],
    imports: ['Anthropic', 'anthropic', '@anthropic-ai'],
    files: [],
    keywords: ['claude', 'messages.create', 'streaming', 'anthropic', 'claude-3', 'claude-sonnet']
  },
  
  sanity: {
    packages: ['@sanity/client', 'sanity', '@sanity/image-url', 'next-sanity'],
    imports: ['createClient', '@sanity/client', 'sanity'],
    files: ['sanity.config.js', 'sanity.config.ts', 'sanity.cli.js', 'schemas/'],
    keywords: ['GROQ', 'createClient', 'sanity.io', 'sanity studio', 'structured content']
  },
  
  finsterAI: {
    packages: ['finster-ai', '@finster/sdk'],
    imports: ['finster', '@finster'],
    files: [],
    keywords: ['finster', 'compliance ai', 'finster.ai']
  },
  
  trmLabs: {
    packages: ['trm-labs', '@trmlabs/sdk', 'trm-sdk'],
    imports: ['trm', '@trmlabs', 'TRM'],
    files: [],
    keywords: ['trm', 'blockchain compliance', 'crypto', 'trmlabs', 'blockchain intelligence']
  },
  
  coder: {
    packages: ['coder-sdk', '@coder/sdk'],
    imports: ['coder', '@coder'],
    files: ['.coder/', 'coder.yaml'],
    keywords: ['coder', 'cloud IDE', 'workspace', 'remote development']
  },
  
  lightpanda: {
    packages: ['lightpanda', '@lightpanda/sdk'],
    imports: ['lightpanda', '@lightpanda'],
    files: [],
    keywords: ['lightpanda', 'browser automation', 'headless browser']
  },
  
  lightningAI: {
    packages: ['lightning', 'pytorch-lightning', '@lightning-ai/sdk', 'lightning-sdk'],
    imports: ['lightning', 'pytorch_lightning', '@lightning-ai'],
    files: ['lightning.yaml', '.lightning/'],
    keywords: ['lightning', 'LightningModule', 'Trainer', 'lightning.ai', 'pytorch lightning']
  },
  
  parallel: {
    packages: ['@parallel-finance/sdk', 'parallel-sdk'],
    imports: ['@parallel-finance', 'parallel'],
    files: [],
    keywords: ['parallel', 'defi', 'polkadot', 'parallel finance']
  },
  
  cleric: {
    packages: ['cleric-sdk', '@cleric/sdk'],
    imports: ['cleric', '@cleric'],
    files: [],
    keywords: ['cleric', 'workflow automation', 'cleric.ai']
  }
  */
};

export const ALL_SPONSORS: string[] = Object.keys(SPONSOR_DETECTION_PATTERNS);

