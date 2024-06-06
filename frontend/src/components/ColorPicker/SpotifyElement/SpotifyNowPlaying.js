import React, { useEffect, useState } from "react";
import getNowPlayingItem from "./SpotifyAPI";
import SpotifyLogo from "./SpotifyLogo";
import PlayingAnimation from "./PlayingAnimation";
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './index.scss'

const SpotifyNowPlaying = (props) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({});

  useEffect(() => {
    Promise.all([
      getNowPlayingItem(
        props.client_id,
        props.client_secret,
        props.refresh_token
      ),
    ]).then((results) => {
      setResult(results[0]);
      setLoading(false);
    });
  });

  console.log(result.songUrl)
  return (
    <div className="player">
        <div className="status">
            <div className="logo">
                <FontAwesomeIcon icon={faSpotify} color='#1ad861'/>
            </div>
            <p className="status-text">{result.isPlaying ? 'Now playing' : "Currently offline"}</p>
        </div>
        {result.isPlaying && 
            <div className="song-box"> 
                <img className="album-art"
                    alt={`${result.title} album art`}
                    src={result.albumImageUrl}
                />
                <div className="song-info">
                    <div className="top-line">
                        <div className="playing-animation">
                            <PlayingAnimation />
                        </div>
                        <a className="song-name" href={result.songUrl} target="_blank">{result.title}</a> 
                    </div>
                   <p className="artist-name">{result.artist}</p>
                </div>
            </div>
        }
    </div>
        
    
    // <Center>
    //   <Box width="xs">
    //     {loading ?
    //       <Stack align="center" mb={8}>
    //         <Spinner size="md" speed="0.6s" thickness={3} color="gray.500" />
    //       </Stack>
    //       :
    //       <Stack width="full" mb={result.isPlaying ? 2 : 4} spacing={3}>
    //         <Stack spacing={2} direction="row" align="center">
    //           <SpotifyLogo />
    //           <Text fontWeight="semibold">{result.isPlaying ? 'Now playing' : "Currently offline"}</Text>
    //           {result.isPlaying && <PlayingAnimation />}
    //         </Stack>
    //         {result.isPlaying &&
    //           <Box p={2} borderRadius="lg" borderWidth={1}>
    //             <Stack direction="row" spacing={4} align="center">
    //               <Image
    //                 alt={`${result.title} album art`}
    //                 src={result.albumImageUrl}
    //                 width={12}
    //                 height={12}
    //                 borderRadius="sm"
    //               />
    //               <Stack spacing={0} overflow="hidden">
    //                 <Link href={result.songUrl} target="_blank">
    //                   <Text
    //                     fontWeight="semibold"
    //                     width="full"
    //                     isTruncated
    //                     color="alph"
    //                   >
    //                     {result.title}
    //                   </Text>
    //                 </Link>
    //                 <Text
    //                   color="gray.500"
    //                   isTruncated
    //                 >
    //                   {result.artist}
    //                 </Text>
    //                 <Text></Text>
    //               </Stack>
    //             </Stack>
    //           </Box>
    //         }
    //       </Stack>
    //     }
    //   </Box>
    // </Center>
  )
};

export default SpotifyNowPlaying;

// const Center = styled.div`
//   position: fixed;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%);
// `;