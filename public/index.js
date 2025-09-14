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
  app: 54121221,
  redirectUrl: "http://localhost",
  responseMode: ConfigResponseMode.Callback,
  source: ConfigSource.LOWCODE,
  scope: "friends wall",
})

new OneTap()
  .render({
    container: document.body,
    showAlternativeLogin: true,
  })
  .on(WidgetEvents.ERROR, console.error)
  .on(OneTapInternalEvents.LOGIN_SUCCESS, payload =>
    Auth.exchangeCode(payload.code, payload.device_id)
      .then(data => console.log({ ...payload, ...data }))
      .catch(console.error),
  )
