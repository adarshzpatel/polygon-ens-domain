import Head from "next/head";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { ethers } from "ethers";
import contractABI from "../components/abi";
import { EtherscanProvider } from "@ethersproject/providers";
const tld = ".wagmi";

const CONTRACT_ADDRESS = "0xb62a8ca1Ad5B21DE21F1299294BAa231c202531b";
const networks = {
  "0x1": "Ethereum Mainnet",
  "0x3": "Ropsten",
  "0x2a": "Kovan",
  "0x4": "Rinkeby",
  "0x5": "Goerli",
  "0x61": "BSC Testnet",
  "0x38": "BSC Mainnet",
  "0x89": "Polygon Mainnet",
  "0x13881": "Polygon Testnet",
  "0xa86a": "AVAX Mainnet",
};

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [record, setRecord] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [mints, setMints] = useState([]);

  const fetchMints = async () => {
    try {
      const { ethereum }:any = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum }: any = window;
      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }
      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum }: any = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    //Check if we are authoriszed to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
    //Check users chain ID
    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const renderNotConnectedContainer = () => (
    <div>
      <button
        onClick={connectWallet}
        className="font-display text-2xl bg-gradient-to-r p-4 px-6 rounded-lg ring-4 text font-bold focus:outline-none active:scale-95 duration-200 ease-out bg-amber-400 hover:bg-amber-300 active:bg-amber-400 ring-stone-700 hover:ring-stone-900 text-amber-900"
      >
        Connect wallet
      </button>
    </div>
  );

  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  }

  const mintDomain = async () => {
    if (!domain) return;
    if (domain.length < 3) {
      alert("Domain must be atleast 3 characters long");
      return;
    }
    const price =
      domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain ", domain, "with price", price);
    try {
      const { ethereum }: any = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        console.log("Going to pop wallet now to pay gas fees.");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        //wait for transaction to be mined
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          console.log(
            "Domain Minted ! https://mumbai.polygonscan.com/tx/" + tx.hash
          );
          //Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();
          console.log(
            "Record set! https://mumbai.polygonscan.com/tx" + tx.hash
          );
          // Call fetchMints after 2 seconds
          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction Failed! Please try again");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum }: any = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        let tx = await contract.setRecord(domain, record);
        await tx.record();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const switchNetwork = async () => {
    const {ethereum}:any = window
    if (ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const renderInputForm = () => {
    if (network !== "Polygon Testnet") {
      return (
        <div className="text-xl flex flex-col  gap-4 text-center font-medium text-amber-900">
          Please Connect To Ploygon Mumbai Testnet !!
          <button
            onClick={switchNetwork}
            className="px-4 rounded-md py-2 w-full font-medium font-display bg-lime-400 hover:bg-lime-300 active:bg-lime-500 duration-200 active:scale-95 ease-out text-lime-900"
          >
            Switch To Polygon Mumbai Testnet
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2  max-w-sm w-full">
        <div className="flex relative group w-full  items-center rounded-md group  bg-amber-200 ">
          <input
            className="bg-;-100 w-full rounded-md px-4 py-2  font-medium  focus:ring-2 ring-amber-600 ring-opacity-50"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className=" right-4 absolute text-xl text-amber-900 font-medium ">
            {tld}
          </p>
        </div>
        <input
          className="px-4 py-2 rounded-md bg-amber-200 placeholder:text-amber-900 placeholder:text-opacity-50 ring-amber-600 ring-opacity-50 font-medium focus:ring-2 "
          type="text"
          value={record}
          placeholder="What's is it that you want to become."
          onChange={(e) => setRecord(e.target.value)}
        />
        {editing ? (
          <div>
            <button onClick={updateDomain} disabled={loading}>
              Set Record
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="flex justify-around gap-2 items-center">
            <button
              onClick={mintDomain}
              disabled={loading}
              className="px-4 disabled:bg-stone-300 disabled:text-stone-700 rounded-md py-2 w-full font-medium font-display bg-lime-400 hover:bg-lime-300 active:bg-lime-500 duration-200 active:scale-95 ease-out"
            >
              Mint
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className=" flex flex-col">
          <p className="text-2xl font-bold font-display"> Recently minted domains!</p>
          <div className="mint-list">
            { mints.map((mint, index) => {
              return (
                <div className="p-4 bg-yellow-400 bg-opacity-25 rounded-xl rounded-yellow my-4" key={index}>
                  <div className='flex justify bg-yellow-'>
                    <a className="text-blue-500" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                      <p className="font-medium underline">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                      <button className="h-4 w-4" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                    }
                  </div>
            <p> {mint.record} </p>
          </div>)
          })}
        </div>
      </div>);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <div className="min-h-screen bg-amber-50 w-screen   flex flex-col">
      <Header address={currentAccount} network={network} />
      <div className="flex flex-1 flex-wrap gap-20 items-center justify-around h-full">
        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
      </div>
    </div>
  );
}
