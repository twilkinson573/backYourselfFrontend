import React from "react";

import { ethers } from "ethers";

import WagerManagerArtifact from "../utils/BackYourselfDev.json";
import ERC20Artifact from "../utils/ERC20Artifact.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

const HARDHAT_NETWORK_ID = '31337';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const WAGER_MANAGER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the WagerManager contract
//   3. Renders the whole application

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      wantToken: undefined,
      nickname: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      nicknameInput: "",
      newWagerOpponentInput: "",
      newWagerSizeInput: 0,
      newWagerDescriptionInput: "",
      wagers: [],
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (typeof(this.state.nickname) == undefined) {
      return <Loading />;
    }

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>Whaddup tho</h1>
            <p>Your wallet address is {this.state.selectedAddress} lol</p>
            <p>Your nickname is {this.state.nickname}, lol</p>
            <div>
              <input type="text" value={this.state.nicknameInput} onChange={e => this.setState({nicknameInput: e.target.value})} />
              <button onClick={() => this._setNickname()} disabled={this.state.nicknameInput == ""} >
                Set Nickname
              </button>
            </div>
            <br />
            <div>
              <input type="text" value={this.state.newWagerOpponentInput} onChange={e => this.setState({newWagerOpponentInput: e.target.value})} />
              <input type="number" value={this.state.newWagerSizeInput} onChange={e => this.setState({newWagerSizeInput: e.target.value})} />
              <input type="text" value={this.state.newWagerDescriptionInput} onChange={e => this.setState({newWagerDescriptionInput: e.target.value})} />
              <button onClick={() => this._createWager(this.state.newWagerOpponentInput, this.state.newWagerSizeInput, this.state.newWagerDescriptionInput)}  >
                Create Wager
              </button>
            </div>
            <br />
            <div>
              <ul>
                {this.state.wagers.map(w => 
                  <li>{`${w.address1}: ${w.wagerSize}. ${w.description}`}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    // this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });

    this._initializeEthers();
    this._fetchNickname();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._wm = new ethers.Contract(
      WAGER_MANAGER_ADDRESS, // get the WagerManager deployed address from running Hardhat deploy script
      WagerManagerArtifact.abi,
      this._provider.getSigner(0)
    );

    const wantToken = await this._wm.wantToken();

    this._wantToken = new ethers.Contract(
      wantToken, 
      ERC20Artifact,
      this._provider.getSigner(0)
    );

  }

  async _fetchNickname() {
    const nickname = await this._wm.getNickname(this.state.selectedAddress);

    this.setState({ nickname });
  }

  async _fetchWagers() {
    const wagers = await this._wm.getWagers();

    this.setState({ wagers });
  }


  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._fetchWagers(), 1000);
    this._fetchWagers();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _setNickname() {
    try {
      console.log(this.state.nicknameInput);
      this._dismissTransactionError();

      const tx = await this._wm.setNickname(this.state.nicknameInput);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._fetchNickname();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _createWager(opponent, size, description) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.

    try {
      this._dismissTransactionError();

      await this._wantToken.approve(WAGER_MANAGER_ADDRESS, ethers.utils.parseUnits(size, 18));

      const tx = await this._wm.createWager(opponent, ethers.utils.parseUnits(size, 18), description);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) { throw new Error("Transaction failed") }

      await this._fetchWagers();
      this.setState({
        newWagerOpponentInput: "",
        newWagerSizeInput: 0,
        newWagerDescriptionInput: "",
      })

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });

    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }

}
