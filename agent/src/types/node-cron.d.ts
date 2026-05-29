declare module "node-cron" {
  type Task = {
    stop?: () => void;
    start?: () => void;
    destroy?: () => void;
  };

  const cron: {
    schedule: (...args: any[]) => Task;
  };

  export default cron;
}
