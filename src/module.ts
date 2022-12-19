import { addComponent, addImports, addServerHandler, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  indexable: boolean
  /**
   * Path to the sitemap.xml file, if it exists.
   */
  sitemap: string | string[] | false
  robotsEnabledValue: string
  robotsDisabledValue: string
  disallow: string[]
}

export interface ModuleHooks {
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-simple-robots',
    compatibility: {
      nuxt: '^3.0.0',
      bridge: false,
    },
    configKey: 'robots',
  },
  defaults(nuxt) {
    return {
      indexable: (nuxt.options.runtimeConfig.indexable && nuxt.options.runtimeConfig.indexable !== false) || process.env.NODE_ENV === 'production',
      sitemap: false,
      disallow: ['/_nuxt/*'],
      robotsEnabledValue: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      robotsDisabledValue: 'noindex, nofollow',
    }
  },
  async setup(config, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hooks.hook('nitro:init', async (nitro) => {
      nitro.options.prerender.routes = nitro.options.prerender.routes || []
      nitro.options.prerender.routes.push('/robots.txt')
    })

    const exports = `const config = ${JSON.stringify(config, null, 2)};\nexport default config`
    // add alias for nuxt app
    const dst = addTemplate({
      filename: 'nuxt-simple-robots.mjs',
      getContents: () => exports,
    })
    nuxt.options.alias['#nuxt-simple-robots/config'] = dst.dst

    nuxt.hooks.hook('nitro:config', (nitroConfig) => {
      // config
      nitroConfig.virtual!['nuxt-simple-robots/config'] = exports
    })

    addImports({
      name: 'defineRobotMeta',
      from: resolve('./runtime/composables/defineRobotMeta'),
    })

    await addComponent({
      name: 'RobotMeta',
      filePath: resolve('./runtime/components/RobotMeta'),
    })

    // give a warning when accessing sitemap in dev mode
    addServerHandler({
      route: '/robots.txt',
      handler: resolve('./runtime/server/robots-route'),
    })
    // give a warning when accessing sitemap in dev mode
    addServerHandler({
      handler: resolve('./runtime/server/robots-middleware'),
    })
  },
})
