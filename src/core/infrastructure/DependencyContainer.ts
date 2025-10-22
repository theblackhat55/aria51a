/**
 * DependencyContainer - Simple dependency injection container
 * Manages service registration and resolution
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = (...args: any[]) => T;
type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

interface ServiceRegistration<T = any> {
  lifetime: ServiceLifetime;
  implementation?: Constructor<T>;
  factory?: Factory<T>;
  instance?: T;
}

export class DependencyContainer {
  private static instance: DependencyContainer;
  private services: Map<string, ServiceRegistration> = new Map();
  private singletons: Map<string, any> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Register a service as singleton
   */
  public registerSingleton<T>(
    key: string,
    implementation: Constructor<T> | Factory<T>
  ): void {
    const registration: ServiceRegistration<T> = {
      lifetime: 'singleton'
    };

    if (typeof implementation === 'function' && implementation.prototype) {
      registration.implementation = implementation as Constructor<T>;
    } else {
      registration.factory = implementation as Factory<T>;
    }

    this.services.set(key, registration);
  }

  /**
   * Register a service as transient (new instance every time)
   */
  public registerTransient<T>(
    key: string,
    implementation: Constructor<T> | Factory<T>
  ): void {
    const registration: ServiceRegistration<T> = {
      lifetime: 'transient'
    };

    if (typeof implementation === 'function' && implementation.prototype) {
      registration.implementation = implementation as Constructor<T>;
    } else {
      registration.factory = implementation as Factory<T>;
    }

    this.services.set(key, registration);
  }

  /**
   * Register a service instance directly
   */
  public registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, {
      lifetime: 'singleton',
      instance
    });
    this.singletons.set(key, instance);
  }

  /**
   * Resolve a service by key
   */
  public resolve<T>(key: string): T {
    const registration = this.services.get(key);
    
    if (!registration) {
      throw new Error(`Service '${key}' not registered`);
    }

    // Return existing instance if available
    if (registration.instance) {
      return registration.instance;
    }

    // Return singleton if already created
    if (registration.lifetime === 'singleton' && this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    // Create new instance
    let instance: T;

    if (registration.implementation) {
      instance = new registration.implementation();
    } else if (registration.factory) {
      instance = registration.factory();
    } else {
      throw new Error(`No implementation or factory found for '${key}'`);
    }

    // Store singleton
    if (registration.lifetime === 'singleton') {
      this.singletons.set(key, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  public clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service keys
   */
  public getKeys(): string[] {
    return Array.from(this.services.keys());
  }
}
