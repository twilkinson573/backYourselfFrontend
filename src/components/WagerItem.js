import React from "react";
import { ethers } from "ethers";

export function WagerItem({w, provideWagerResponse, provideWagerVerdict, requiresResponse, requiresVerdict, nicknames, selectedAddress}) {
  return (
    <li className="row">
      <div>{Number(w.wagerId)}</div>
      <div>🗡 {nicknames[w.address0] ? nicknames[w.address0] : w.address0}</div>
      <div>🛡 {nicknames[w.address1] ? nicknames[w.address1] : w.address1}</div>
      <div>${ethers.utils.formatEther(w.wagerSize) * 2}</div>
      <div>{w.description}</div>

      {requiresResponse && 
        <div>
          <button onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 2)} >
            Accept Wager! 😈
          </button>
          <button onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 1)} >
            Decline 🚫
          </button>
        </div>
      }

      {requiresVerdict && 
        <div>
          {(
            (w.address0.toLowerCase() === selectedAddress && w.address0Verdict === 0) || 
            (w.address1.toLowerCase() === selectedAddress && w.address1Verdict === 0)
          ) &&
            <div>
              <button onClick={() => provideWagerVerdict(Number(w.wagerId), 2)} >
                I Won!
              </button>
              <button onClick={() => provideWagerVerdict(Number(w.wagerId), 1)} >
                I Lost :(
              </button>
            </div>
          }
        </div>
      }

    </li>
  );
}
