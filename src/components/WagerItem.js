import React from "react";
import { ethers } from "ethers";

export function WagerItem({w, provideWagerResponse, provideWagerVerdict, requiresResponse, requiresVerdict, nicknames}) {
  return (
    <li>
      <div>{Number(w.wagerId)}</div>
      <div>{nicknames[w.address0] ? nicknames[w.address0] : w.address0}</div>
      <div>${ethers.utils.formatEther(w.wagerSize) * 2}</div>
      <div>{w.description}</div>
      {requiresResponse && 
        <div>
          <button onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 2)} >
            Accept Wager
          </button>
          <button onClick={() => provideWagerResponse(Number(w.wagerId), w.wagerSize, 1)} >
            Decline Wager
          </button>
        </div>
      }
    </li>
  );
}
