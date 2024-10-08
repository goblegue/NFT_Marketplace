import { gql, useQuery } from "@apollo/client";
import useSigner from "state/signer";
import { NFT_MARKET_ADDRESS } from "./config";
import { parseRawNFT } from "./helpers";
import {
  GetListedNFTs,
  GetListedNFTsVariables,
} from "./__generated__/GetListedNFTs";

const useListedNFTs = () => {
  const { address } = useSigner();

  const { data } = useQuery<GetListedNFTs, GetListedNFTsVariables>(
    GET_LISTED_NFTS,
    { skip: !address }
  );
  const listedNFTs = data?.nfts.map(parseRawNFT);

  return { listedNFTs };
};

const GET_LISTED_NFTS = gql`
  query GetListedNFTs {
    nfts(
      where: {
        to: "${NFT_MARKET_ADDRESS}"
      }
    ) {
      id
      from
      to
      tokenURI
      price
    }
  }
`;

export default useListedNFTs;
