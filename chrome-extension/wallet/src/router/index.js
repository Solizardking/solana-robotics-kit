import TokenView from "../views/TokenView.js";
import NFTView from "../views/NFTView.js";
import SettingsView from "../views/SettingsView.js";
import LanguageView from "../views/settings/LanguageView.js";
import TrustedSitesView from "../views/settings/TrustedSitesView.js";
import RPCSelectView from "../views/settings/RPCSelectView.js";
import LockTimeoutView from "../views/settings/LockTimeoutView.js";
import DefaultExplorerView from "../views/settings/DefaultExplorerView.js";
import PluginSettingsView from "../views/settings/PluginsView.js";
import LoginPasscodeView from "../views/auth/LoginView.js";
import SetPasscodeView from "../views/SetPasscodeView.js";
import WalletNameView from "../views/settings/WalletNameView.js";
import ComingSoonView from "../views/ComingSoonView.js";
import NFTShowView from "../views/NFTShowView.js";
import PluginView from "../views/PluginView.js";
import TokenShowView from "../views/TokenShowView.js";
import SwapWalletView from "../views/SwapWalletView.js";
import AddWalletView from "../views/creation/AddWalletView.js";
import WalletCreateView from "../views/creation/WalletCreateView.js";
import WalletImportView from "../views/creation/WalletImportView.js";
import WalletCreateSaveView from "../views/creation/WalletCreateSaveView.js";
import RemoveWalletView from "../views/creation/RemoveWalletView.js";
import CustomRPCView from "../views/settings/CustomRPCView.js";
import ApproveTrustedSiteView from "../views/approval/ApproveTrustedSiteView.js";
import ApproveTxnView from "../views/approval/ApproveTxnView.js";
import SetPinCodeView from "../views/SetPinCodeView.js";
import LoginPinCodeView from "../views/auth/LoginPinCodeView.js";
import CreditsView from "../views/settings/CreditsView.js";
import ApproveMessageView from "../views/approval/ApproveMessageView.js";
import AuthActionView from "../views/auth/AuthActionView.js";
import ExportKeyView from "../views/settings/ExportKeyView.js";
import SendSOLView from "../views/transactions/SendSOLView.js";
import SendConfirmView from "../views/transactions/SendConfirmView.js";
import {SendTokenView} from "../views/transactions/SendTokenView.js";
import {StakeSOLView} from "../views/transactions/StakeSOLView.js";
import {SendNFTView} from "../views/transactions/SendNFTView.js";
import SendConfirmNFTView from "../views/transactions/SendConfirmNFTView.js";
import {LoadingView} from "../views/LoadingView.js";
import {
  MonitorTransactionView
} from "../views/transactions/MonitorTransactionView.js";
import WalletImportMnemonicView
  from "../views/creation/WalletImportMnemonicView.js";

const _routes = [
  {hash: "login", view: LoginPasscodeView},
  {hash: "login_pin", view: LoginPinCodeView},

  {hash: "tokens", view: TokenView},
  {hash: "tokens/show", view: TokenShowView},
  {hash: "nft", view: NFTView},
  {hash: "nft/show", view: NFTShowView},

  {hash: "transfer/deposit", view: ComingSoonView},
  {hash: "transfer/send_sol", view: SendSOLView},
  {hash: "transfer/send_tokens", view: SendTokenView},
  {hash: "transfer/send_nft", view: SendNFTView},
  {hash: "transfer/stake", view: StakeSOLView},
  {hash: "transfer/transaction", view: MonitorTransactionView},
  {hash: "transfer/confirm/tokens", view: SendConfirmView},
  {hash: "transfer/confirm/nfts", view: SendConfirmNFTView},

  {hash: "plugins", view: PluginView},
  {hash: "plugin_hub", view: ComingSoonView},
  {hash: "settings", view: SettingsView},
  {hash: "set_passcode", view: SetPasscodeView},

  {hash: "wallets/swap", view: SwapWalletView},
  {hash: "wallets/set_pin", view: SetPinCodeView},

  {hash: "wallets/add", view: AddWalletView},
  {hash: "wallets/create", view: WalletCreateView},
  {hash: "wallets/create/save", view: WalletCreateSaveView},
  {hash: "wallets/remove", view: RemoveWalletView},
  {hash: "wallets/import", view: WalletImportView},
  {hash: "wallets/import_mnemonic", view: WalletImportMnemonicView},
  {hash: "wallets/connect", view: ComingSoonView},

  //Used to set wallet_addr prior to wallet creation implemented
  {hash: "settings/wallet_name", view: WalletNameView},

  {hash: "auth/trusted_site", view: ApproveTrustedSiteView},
  {hash: "auth/approve_txn", view: ApproveTxnView},
  {hash: "auth/approve_msg", view: ApproveMessageView},
  {hash: "auth/auth_action", view: AuthActionView},

  {hash: "settings/trusted_apps", view: TrustedSitesView},
  {hash: "settings/language", view: LanguageView},
  {hash: "settings/rpc", view: RPCSelectView},
  {hash: "settings/rpc/custom", view: CustomRPCView},
  {hash: "settings/lock_timeout", view: LockTimeoutView},
  {hash: "settings/default_explorer", view: DefaultExplorerView},
  {hash: "settings/plugins", view: PluginSettingsView},
  {hash: "settings/credits", view: CreditsView},
  {hash: "settings/export_key", view: ExportKeyView},
]

export class Router {

  noLockRequired = {
    "set_passcode": true,
    "auth/approve_txn": true,
    "auth/approve_msg": true,
    "auth/auth_action": true,
  }

  _loadingView = new LoadingView(null, null, {})

  appContainer

  wallet

  currentView

  _pluginRoutes = [];

  currentRoute = null
  lastRoute = null

  _routes

  constructor(wallet) {
    this._routes = _routes
    this.wallet = wallet
  }

  addRoute(hash, view) {
    if (this._routes.find((r) => r.hash === r.hash))
      throw new Error("addRoute - hash already defined")

    this._routes.push({
      hash: hash,
      view: view
    })
  }

  addPluginRoute(plugin, hash, view) {
    const phash = `plugins/${plugin.getSlug()}/${hash}`

    if (this._pluginRoutes.find((r) => r.hash === phash))
      throw new Error("addPluginRoute - hash already defined")

    this._pluginRoutes.push({
      hash: phash,
      view: view,
      plugin: plugin.getSlug()
    })
  }

  addSettingRoute(hash, view) {
    return this.addRoute(`settings/plugins/${hash}`, view)
  }

  back() {
    if (!this.lastRoute)
      return

    return this.navigateTo(this.lastRoute.hash, this.lastRoute.data)
  }

  navigateTo(hash, data = {}) {
    this.lastRoute = this.currentRoute
    history.pushState(null, null, hash);
    return this.onNavigate(hash, data);
  };

  /**
   * Returns routes & plugin routes
   * @returns {[]}
   */
  getRoutes() {
    return this._routes.concat(this._pluginRoutes)
  }

  async onNavigate(hash = "login_pin", data = {}) {
    if (this.wallet.isLocked() && !this.noLockRequired[hash]) {
      if (hash !== "login" && hash !== "login_pin")
        data.redirect_to = hash

      if (await this.wallet.isPinCodeSet() && hash !== "login") {
        hash = "login_pin"
      } else {
        hash = "login"
      }
      console.log("Wallet locked, redirecting", hash)
    }

    const routes = this.getRoutes()
    let match = routes.find(potentialMatch => {
      return hash === potentialMatch.hash
    });

    /* Route not found - return first route OR a specific "not-found" route */
    if (!match) {
      match = routes[0];
    }

    return this.updateView(match, data)
  }

  async updateView(match, data = {}) {
    await this.setLoadingView(true)

    this.currentRoute = {hash: match.hash, data: data}
    this.currentView = new match.view(this, this.wallet, data);

    if (match.plugin) {
      this.appContainer.className = match.plugin
    } else {
      this.appContainer.className = ""
    }

    if (!await this.currentView.beforeMount())
      return //View updated dont proceed

    this.appContainer.innerHTML = await this.currentView.getHtml();

    await this.currentView.onMounted(this.appContainer);
  }


  async setLoadingView(show) {
    if (show)
      this.appContainer.innerHTML = await this._loadingView.getHtml()
  }


  async refresh() {
    await this.currentView.onDismount()
    this.appContainer.innerHTML = await this.currentView.getHtml();
    await this.currentView.onMounted(this.appContainer);
  }

  bind(document) {

    this.appContainer = document.querySelector("#app")

    document.body.addEventListener("click", e => {

      if (e.target.matches('[target="_blank"]')) {
        return
      }

      if (e.target.matches("[data-link]")) {
        e.preventDefault();
        this.navigateTo(e.target.dataset.link);
      }
    });
  }


  printRoutes() {
    const routes = this.getRoutes()
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      console.log(`${route.hash}`)
    }
  }
}
