interface IpetexConfig {
  userName: string,
  password: string,
  server: string,
  options: {
    encrypt: boolean | undefined,
    database: string,
  }
}

export {
  IpetexConfig,
}
