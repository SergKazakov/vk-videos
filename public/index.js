import {
  Auth,
  Config,
  ConfigResponseMode,
  ConfigSource,
  OneTap,
  OneTapInternalEvents,
  WidgetEvents,
} from "@vkid/sdk"

Config.init({
  app: 54_121_221,
  redirectUrl: "http://localhost",
  responseMode: ConfigResponseMode.Callback,
  source: ConfigSource.LOWCODE,
  scope: "friends wall",
})

new OneTap()
  .render({ container: document.body, showAlternativeLogin: true })
  .on(WidgetEvents.ERROR, console.error)
  .on(OneTapInternalEvents.LOGIN_SUCCESS, async payload => {
    try {
      const data = await Auth.exchangeCode(payload.code, payload.device_id)

      console.log({ ...payload, ...data })
    } catch (error) {
      console.error(error)
    }
  })
