//import { useState } from 'react';
//import { createRoot } from 'react-dom/client';
const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

interface IRawPlayer {
  id: number;
  first_name: string;
  last_name: string;
  team: { full_name: string; id: number };
  position: string;
  //etc..
}

interface IPlayer {
  id: number;
  fullName: string;
  team: string;
}

const PLAYERS_API = "https://www.balldontlie.io/api/v1/players";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const useFetch = (
  url: string,
  controller: AbortController,
  callback?: (v: any) => void
) => {
  const { signal } = controller;
  const fetchData = async () => {
    await sleep(2000); //just to slow it down a bit
    const response = await fetch(url, {
      signal
    });
    if (!response.ok) {
      throw new Error("Something went wrong :/");
    }
    const data = await response.json();
    return callback ? callback(data) : data;
  };

  useEffect(() => {
    return () => controller.abort("Aborted! component was unmount");
  }, []);

  return [fetchData, signal] as const;
};
/*================================================================*/

const PlayersList = ({
  abortController,
  setAbortReason
}: {
  abortController: AbortController;
  setAbortReason: (v: string) => void;
}) => {
  const [fetchedPlayers, setFetchedPlayers] = useState<IPlayer[]>([]);
  const [fetchPlayersHandler, signal] = useFetch(PLAYERS_API, abortController);

  const formatPlayers = (data: any): IPlayer[] => {
    return data.data.map((player: IRawPlayer) => {
      return {
        id: player.id,
        fullName: `${player.first_name} ${player.last_name}`,
        team: player.team.full_name,
        position: player.position
      };
    });
  };
  useEffect(() => {
    setAbortReason("");
    fetchPlayersHandler()
      .then((res) => {
        const formattedPlayers = formatPlayers(res);
        setFetchedPlayers(formattedPlayers);
      })
      .catch((err) => {
        if (signal.aborted) {
          setAbortReason(signal.reason);
        } else {
          console.error(`Request not aborted, ${err}`);
          //handle error...
        }
      });
    return () => {
      setFetchedPlayers([]);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (!signal.aborted) {
        setAbortReason("Did not abort");
      } else {
        setFetchedPlayers([]);
      }
    };
  }, [fetchedPlayers]);

  return (
    <ul className="list-container">
      {fetchedPlayers?.map((p) => {
        return (
          <li key={p.id}>
            <h3>{p.fullName}</h3>
            <h4>{p.team}</h4>
          </li>
        );
      })}
    </ul>
  );
};
/*================================================================*/

const ControllPanel = ({ showList }: { showList: (v: boolean) => void }) => {
  const showHandler = () => {
    showList(true);
  };

  const cancelHandler = () => {
    showList(false);
  };

  return (
    <div className="main">
      <div className="controll-panel">
        <button onClick={showHandler}>show players</button>
        <button onClick={cancelHandler}>cancel</button>
      </div>
    </div>
  );
};
/*================================================================*/

const Container = () => {
  const [isShow, setIsShow] = useState(false);
  const [abortReason, setAbortReason] = useState("");
  const controller = new AbortController();

  const setReason = (v: string) => setAbortReason(v);

  const renederList = (toShow: boolean) => {
    setIsShow(toShow);
  };

  useEffect(() => {
    () => setReason("");
  }, []);

  return (
    <>
      <ControllPanel showList={renederList} />
      {isShow ? (
        <PlayersList abortController={controller} setAbortReason={setReason} />
      ) : (
        abortReason && (
          <div className="abort-fallback">
            <h1>{abortReason}</h1>
          </div>
        )
      )}
    </>
  );
};
/*================================================================*/

const App = () => {
  return <Container />;
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
