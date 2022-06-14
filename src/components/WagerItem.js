import React from "react";
import { ethers } from "ethers";

export function WagerItem({w, provideWagerResponse, provideWagerVerdict, requiresResponse, requiresVerdict, nicknames, selectedAddress}) {
  return (
    <li>
      <div className="row">
        <div className="col-3"><span role="img">🗡</span></div>
        <div className="col-3"><span role="img">🛡</span></div>
        <div className="col-2"><span role="img">💰</span></div>
        <div className="col-4"><span role="img">✍️</span></div>
      </div>

      <div className="row">
        <div className="col-3">
          <p>{`${w.address0.substring(0,10)}...${w.address0.slice(-10)}`}</p>
          <p>{nicknames[w.address0] ? nicknames[w.address0] : "-"}</p>
        </div>
        <div className="col-3">
          <p>{`${w.address1.substring(0,10)}...${w.address1.slice(-10)}`}</p>
          <p>{nicknames[w.address1] ? nicknames[w.address1] : "-"}</p>
        </div>
        <div className="col-2">
          <p>${ethers.utils.formatEther(w.wagerSize) * 2}</p>
        </div>
        <div className="col-4">
          <span>{w.description}</span>
        </div>
      </div>

      {requiresResponse && 
        <div className="row">
          <div className="col-4" style={{display: "flex", justifyContent: "space-between"}}>
            <button className="btn btn-success" onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 2)} >
              Accept Wager! 😈
            </button>
            <button className="btn btn-danger" onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 1)} >
              Decline 🚫
            </button>
          </div>
        </div>
      }

      {requiresVerdict && 
        <div>
          {(
            (w.address0.toLowerCase() === selectedAddress && w.address0Verdict === 0) || 
            (w.address1.toLowerCase() === selectedAddress && w.address1Verdict === 0)
          ) &&
            <div className="row">
              <div className="col-4" style={{display: "flex", justifyContent: "space-between"}}>
                <button className="btn btn-success" onClick={() => provideWagerVerdict(Number(w.wagerId), 2)} >
                  I Won! 🏆
                </button>
                <button className="btn btn-danger" onClick={() => provideWagerVerdict(Number(w.wagerId), 1)} >
                  I Lost 😔
                </button>
              </div>
            </div>
          }
        </div>
      }

    <br />
    </li>
  );
}
