import React from "react";

import { ethers } from "ethers";

import WagerManagerArtifact from "../utils/WagerManager.json";
import ERC20Artifact from "../utils/ERC20Artifact.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { WagerItem } from "./WagerItem";
// import { TransactionErrorMessage } from "./TransactionErrorMessage";
// import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

const HARDHAT_NETWORK_ID = '31337';
const POLYGON_NETWORK_ID = '137';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const WAGER_MANAGER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      wantToken: undefined,
      userNickname: undefined,
      nicknames: {},
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

    if (typeof(this.state.userNickname) == undefined) {
      return <Loading />;
    }

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>Back Yourself <span role='img' aria-label='money'>💸</span></h1>
            <p>The Wagering Dapp - challenge your friends with USDC in escrow, winner takes all!</p>
            <br /> 
            <h4>How to play:</h4>
            <p>1. Challenge a friend to a wager irl or online, agree to the challenge & amount at stake</p>
            <p>2. Create the wager below by escrowing your stake in USDC on the Polygon network</p>
            <p>3. Your opponent may accept or decline the created wager. If they accept, they escrow a matching stake</p>
            <p>4. The wager is now live, when the challenge is complete you both record the result of who won</p>
            <p>5. The winner takes both stakes (minus a small 1% platform fee) and the glory of victory! <span role='img' aria-label='trophy'>🏆</span></p>
            <br />
            <p>Note! If the result of who won is contested a form of slashing takes place.</p>
            <p>In these cases of foul play, the protocol keeps the stakes (and the bad loser probably never gets challenged again!)
            </p>
          </div>
        </div>
        <hr />

        <div className="row">
          <div className="col-12" style={{display: "flex", justifyContent: "center"}}>
            <h4>💸💸💸 Your Career Winnings: ${ethers.utils.formatEther(this._getWonCompleteWagers(this.state.wagers).reduce((a, w) => a + w.wagerSize, 0))} 💸💸💸</h4>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <h4>Your Nickname: {this.state.userNickname ? this.state.userNickname : " - "}</h4>
            <p>Create a human-friendly nickname so your friends can recognise you easily</p>
            <div>
              <input type="text" value={this.state.nicknameInput} maxLength='20' onChange={e => this.setState({nicknameInput: e.target.value})} />
              <button className="btn btn-warning" onClick={() => this._setUserNickname()} disabled={this.state.nicknameInput === ""} >
                Update Your Nickname
              </button>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-6">
            <h4>Create a new Wager</h4>
            <div style={{display:"flex", flexDirection:"column"}}>
              <span>Paste your opponent's Polygon address</span>
              <input 
                type="text" 
                placeholder="0x...."
                value={this.state.newWagerOpponentInput} 
                onChange={e => this.setState({newWagerOpponentInput: e.target.value})} 
              />
              <span>How much USDC are you each staking ($)</span>
              <input 
                type="number" 
                min="1"
                value={this.state.newWagerSizeInput} 
                onChange={e => this.setState({newWagerSizeInput: e.target.value})} 
              />
              <span>Add a short description</span>
              <input 
                type="text" 
                placeholder="Max 60 chars"
                maxLength="60"
                value={this.state.newWagerDescriptionInput} 
                onChange={e => this.setState({newWagerDescriptionInput: e.target.value})} 
              />
              <br />
              <button className="btn btn-warning" onClick={() => this._createWager(this.state.newWagerOpponentInput, this.state.newWagerSizeInput, this.state.newWagerDescriptionInput)} >
                Create Your Wager!
              </button>
            </div>
          </div>
        </div>
        <br />
        <hr />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>You've been Challenged!</h4>
              <p>People have challenged you to the following wagers, you must now accept or decline</p>
              <p>If you accept, you will be prompted to escrow your USDC stake and the challenge will become live 🥊</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getInboxWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={true}
                    requiresVerdict={false}
                    provideWagerResponse={this._provideWagerResponse} 
                  />
                )}
              </ul>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>Awaiting Opponent's Response</h4>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getOutboxWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>Active Wagers</h4>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getActiveWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={true}
                    provideWagerVerdict={this._provideWagerVerdict} 
                    selectedAddress={this.state.selectedAddress}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>Awaiting Opponent's Verdict</h4>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getAwaitingVerdictWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>Complete Wagers</h4>
              <p>Wagers You Won - Your Glorious Pantheon of Success! 🏆</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getWonCompleteWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
              <br />
              <p>Wagers You Lost - Your Painful Graveyard of Defeat 😔</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getLostCompleteWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
              <br />
              <p>Disputed Wagers - Cases where the Result could not be Agreed 👮‍♂️</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getDisputedCompleteWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-12">
            <div>
              <h4>Declined Wagers</h4>
              <p>Wagers You Declined</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getSelfDeclinedWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
              <br />
              <p>Wagers Opponents Declined</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                {this._getOpponentDeclinedWagers(this.state.wagers).map(w => 
                  <WagerItem 
                    key={w.wagerId}
                    w={w}  
                    nicknames={this.state.nicknames}
                    requiresResponse={false}
                    requiresVerdict={false}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>

      </div>
    );
  }



  _getInboxWagers(wagers) {
    return wagers.filter(w => w.status === 0 && w.address1.toLowerCase() === this.state.selectedAddress)
  }

  _getOutboxWagers(wagers) {
    return wagers.filter(w => w.status === 0 && w.address0.toLowerCase() === this.state.selectedAddress)
  }

  _getActiveWagers(wagers) {
    let address0Matches = wagers.filter(w => 
      w.status === 2 &&
      w.address0.toLowerCase() === this.state.selectedAddress && 
      w.address0Verdict === 0
    )
    let address1Matches = wagers.filter(w => 
      w.status === 2 &&
      w.address1.toLowerCase() === this.state.selectedAddress && 
      w.address1Verdict === 0
    )

    return [...address0Matches, ...address1Matches];
  }

  _getAwaitingVerdictWagers(wagers) {
    let address0Matches = wagers.filter(w => 
      w.status === 2 &&
      w.address0.toLowerCase() === this.state.selectedAddress && 
      w.address0Verdict !== 0
    )
    let address1Matches = wagers.filter(w => 
      w.status === 2 &&
      w.address1.toLowerCase() === this.state.selectedAddress && 
      w.address1Verdict !== 0
    )

    return [...address0Matches, ...address1Matches];
  }

  _getWonCompleteWagers(wagers) {
    let address0Matches = wagers.filter(w => 
      w.status === 3 &&
      w.address0Verdict !== w.address1Verdict &&
      w.address0.toLowerCase() === this.state.selectedAddress && 
      w.address0Verdict === 2
    )

    let address1Matches = wagers.filter(w => 
      w.status === 3 &&
      w.address0Verdict !== w.address1Verdict &&
      w.address1.toLowerCase() === this.state.selectedAddress && 
      w.address1Verdict === 2
    )

    return [...address0Matches, ...address1Matches];
  }

  _getLostCompleteWagers(wagers) {
    let address0Matches = wagers.filter(w => 
      w.status === 3 && 
      w.address0Verdict !== w.address1Verdict &&
      w.address0.toLowerCase() === this.state.selectedAddress && 
      w.address0Verdict === 1
    )

    let address1Matches = wagers.filter(w => 
      w.status === 3 && 
      w.address0Verdict !== w.address1Verdict &&
      w.address1.toLowerCase() === this.state.selectedAddress && 
      w.address1Verdict === 1
    )

    return [...address0Matches, ...address1Matches];
  }

  _getDisputedCompleteWagers(wagers) {
    return wagers.filter(w => w.status === 3 && w.address0Verdict === w.address1Verdict)
  }

  _getOpponentDeclinedWagers(wagers) {
    return wagers.filter(w => w.status === 1 && w.address0.toLowerCase() === this.state.selectedAddress)
  }

  _getSelfDeclinedWagers(wagers) {
    return wagers.filter(w => w.status === 1 && w.address1.toLowerCase() === this.state.selectedAddress)
  }


  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!this._checkNetwork()) { return };

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      if (newAddress === undefined) { return this._resetState() };
      
      this._initialize(newAddress);
    });
    
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    this.setState({ selectedAddress: userAddress });

    this._initializeEthers();
    this._fetchUserNickname();
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

  async _fetchUserNickname() {
    const userNickname = await this._wm.getNickname(this.state.selectedAddress);

    this.setState({ userNickname });
  }

  async _fetchNicknames() {
    let addresses = [
      ...this.state.wagers.map(w => w.address0).filter(a => a !== this.state.SelectedAddress), 
      ...this.state.wagers.map(w => w.address1).filter(a => a !== this.state.SelectedAddress)
    ]
    let uniqueAddresses = [...new Set(addresses)];

    let nicknames = {};

    uniqueAddresses.forEach(async a =>
      nicknames[a] = await this._fetchNickname(a)
    )

    this.setState({ nicknames })

  }

  async _fetchNickname(address) {
    if(!localStorage.getItem(address) || localStorage.getItem(address).length === 0 ) {
      const nickname = await this._wm.getNickname(address); 
      localStorage.setItem(address, nickname);
      return nickname

    } else {
      return localStorage.getItem(address)

    }
  }

  async _fetchUserWagers() {
    const wagers = await this._wm.getWagers();

    this.setState({ wagers });
  }

  async _startPollingData() {
    this._pollDataInterval1 = setInterval(() => this._fetchUserWagers(), 1000);
    await this._fetchUserWagers();

    this._pollDataInterval2 = setInterval(() => this._fetchNicknames(), 30000);
    this._fetchNicknames();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval1);
    clearInterval(this._pollDataInterval2);
    this._pollDataInterval1 = undefined;
    this._pollDataInterval2 = undefined;
  }

  async _setUserNickname() {
    try {
      console.log(this.state.nicknameInput);
      this._dismissTransactionError();

      const tx = await this._wm.setNickname(this.state.nicknameInput);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) { throw new Error("Transaction failed") };

      await this._fetchUserNickname();
      this.setState({ nicknameInput: "" });
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return };
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

      if (receipt.status === 0) { throw new Error("Transaction failed") };

      await this._fetchUserWagers();
      this.setState({
        newWagerOpponentInput: "",
        newWagerSizeInput: 0,
        newWagerDescriptionInput: "",
      })

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return };
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _provideWagerResponse = async (wagerId, wagerSize, response) => {
    try {
      this._dismissTransactionError();

      await this._wantToken.approve(WAGER_MANAGER_ADDRESS, ethers.utils.parseUnits(ethers.utils.formatEther(wagerSize)));

      const tx = await this._wm.provideWagerResponse(wagerId, response);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) { throw new Error("Transaction failed") };

      await this._fetchUserWagers();

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return };
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _provideWagerVerdict = async (wagerId, verdict) => {
    try {
      this._dismissTransactionError();

      const tx = await this._wm.provideWagerVerdict(wagerId, verdict);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) { throw new Error("Transaction failed") };

      await this._fetchUserWagers();

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) { return };
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
    if (error.data) { return error.data.message };

    return error.message;
  }

  _resetState() {
    localStorage.clear();
    this.setState(this.initialState);
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) { return true };
    this.setState({ networkError: 'Please connect Metamask to Polygon' });

    return false;
  }

}
