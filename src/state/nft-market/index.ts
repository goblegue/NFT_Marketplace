import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, ethers } from "ethers";
import { CreationValues } from "modules/CreationPage/CreationForm";
import useSigner from "state/signer";
import NFT_MARKET from "../../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import { NFT_MARKET_ADDRESS } from "./config";
import { NFT } from "./interfaces";
import useListedNFTs from "./useListedNFTs";
import useOwnedListedNFTs from "./useOwnedListedNFTs";
import useOwnedNFTs from "./useOwnedNFTs";
import axios, { AxiosResponse } from "axios";

const useNFTMarket = () => {
  const { signer } = useSigner();
  const nftMarket = new Contract(NFT_MARKET_ADDRESS, NFT_MARKET.abi, signer);

  const ownedNFTs = useOwnedNFTs();
  const ownedListedNFTs = useOwnedListedNFTs();
  const listedNFTs = useListedNFTs();

  const uploadImageToIPFS = async (
    imageData: string,
    name: string
  ): Promise<string> => {
    if (!imageData) {
      return "";
    } else {
      try {
        const blob: Blob = await fetch(imageData).then((res) => res.blob());

        const formData = new FormData();
        formData.append("file", blob, "image.png");

        const metadata = JSON.stringify({
          name: name,
        });
        formData.append("pinataMetadata", metadata);

        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

        // Log the token to verify it's being read correctly
        const token = process.env.NEXT_PUBLIC_PINATA_JWT;

        const response = await axios.post(url, formData, {
          maxBodyLength: Infinity,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${
              (formData as any)._boundary
            }`,
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data.IpfsHash;
      } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw error;
      }
    }
  };

  const uploadNFTMetaData = async (
    imageData: string | undefined,
    name: string,
    description: string
  ): Promise<AxiosResponse<any, any>|undefined> => {
    try {
      var imageCID = "";
      if (imageData) {
        imageCID = await uploadImageToIPFS(imageData, name);
      }

      const jsonData = JSON.stringify({
        pinataContent: {
          name: name,
          description: description,
          image: `ipfs://${imageCID}`,
          external_url: `https://pinata.cloud`,
        },
        pinataMetadata: {
          name: name,
        },
      });

      // Log the token to verify it's being read correctly
      const token = process.env.NEXT_PUBLIC_PINATA_JWT;

      const uploadRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return uploadRes;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  const createNFT = async (values: CreationValues): Promise<boolean> => {
    try {
      // Provide a default value for imageData
      const response = await uploadNFTMetaData(
        values.image,
        values.name,
        values.description
      );
      if (response && response.status == 200) {
        const NFTMetaDataCID = response.data.IpfsHash;
        const tokenURI = `ipfs://${NFTMetaDataCID}`;
        console.log("Token URI:", tokenURI);

        const transaction: TransactionResponse = await nftMarket.createNFT(
          tokenURI
        );
        const transactionRecept = await transaction.wait();
        if (transactionRecept.status == 1) {
          return true;
        } else {
          return false;
        }
      }
      else{
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const listNFT = async (tokenID: string, price: BigNumber):Promise<boolean> => {
    const transaction: TransactionResponse = await nftMarket.listNFT(
      tokenID,
      price
    );
    const transactionRecept = await transaction.wait();
    if (transactionRecept.status == 1) {
      return true;
    } else {
      return false;
    }

  };

  const cancelListing = async (tokenID: string) => {
    const transaction: TransactionResponse = await nftMarket.cancelListing(
      tokenID
    );
    await transaction.wait();
  };

  const buyNFT = async (nft: NFT) => {
    const transaction: TransactionResponse = await nftMarket.buyNFT(nft.id, {
      value: ethers.utils.parseEther(nft.price),
    });
    await transaction.wait();
  };

  return {
    createNFT,
    listNFT,
    cancelListing,
    buyNFT,
    ...ownedNFTs,
    ...ownedListedNFTs,
    ...listedNFTs,
  };
};

export default useNFTMarket;
