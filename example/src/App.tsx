import React from "react";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "./react-pdf-highlighter";

import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";

import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./Spinner";
import { Sidebar } from "./Sidebar";

import "./style/App.css";

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

interface State {
  data: Uint8Array | null;
  url: string;
  highlights: Array<IHighlight>;
  categoryLabels: Array<{ label: string; background: string }>;
  destinationPage: number;
  pageCount: number;
  currentPage: number;
  flag: boolean;
}

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; category: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.category} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";

import testPdf from "./bruh.pdf"

const searchParams = new URLSearchParams(document.location.search);

const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

function App() {
  const [state, setState] = React.useState<State>({
    data: null,
    url: initialUrl,
    highlights: testHighlights[initialUrl]
      ? [...testHighlights[initialUrl]]
      : [],
    categoryLabels: [
      { label: "Assumption", background: "#95c7e0" },
      { label: "Premise", background: "#609b91" },
      { label: "Target", background: "#ce7e8b" },
    ],
    destinationPage: 1,
    pageCount: 0,
    currentPage: 1,
    flag: false
  });

  const commentRefs = React.useRef(state.highlights.map(() => React.createRef<HTMLLIElement>()))


  const resetHighlights = () => {
    setState((prev) => ({
      ...prev, highlights: [],
    }));
  };

  const setCategoryLabels = (update: { label: string; background: string }[]) => {
    setState((prev) => {
      return { ...prev, categoryLabels: update };
    });
  };

  const toggleDocument = () => {

    setState((prev) => {
      const newUrl =
        prev.url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;
      return {
        ...prev,
        url: newUrl,
        highlights: testHighlights[newUrl] ? [...testHighlights[newUrl]] : [],
      }
    });
  };

  let scrollViewerTo = (highlight: any) => { };

  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight) {
      scrollViewerTo(highlight);
    }
  };

  React.useEffect(() => {
    window.addEventListener(
      "hashchange",
      scrollToHighlightFromHash,
      false
    );
  }, [])


  function getHighlightById(id: string) {
    const { highlights } = state;

    return highlights.find((highlight) => highlight.id === id);
  }

  function addHighlight(highlight: NewHighlight) {

    console.log("Saving highlight", highlight);

    setState((prev) => {
      const { highlights } = prev;
      console.log("Saving highlight", highlight);
      commentRefs.current.push(React.createRef<HTMLLIElement>())
      return {
        ...prev,
        highlights: [{ ...highlight, id: getNextId() }, ...highlights],
      }
    });
  }

  function getHighlightIndex(highlightId: string): number {
    for (let index = 0; index < highlights.length; index++) {
      if (highlights[index].id === highlightId)
        return index
    }
    return 0
  }
  function updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
            id,
            position: { ...originalPosition, ...position },
            content: { ...originalContent, ...content },
            ...rest,
          }
          : h;
      }),
    }));
  }

  const { highlights, data } = state;

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <button onClick={() => setState(prev => ({ ...prev, flag: !prev.flag }))}>toggle mode {state.flag ? "view only" : "suggest only"}</button>
      <div
        style={{
          position: "absolute",
          left: "10px",
          display: "flex",
          gap: "10px",
          zIndex: 100,
        }}
      >
        <button
          style={{
            width: "70px",
            height: "20px",
            backgroundColor: "grey",
            borderRadius: "5px",
          }}
          onClick={() =>
            setState((prev) => ({
              ...prev,
              destinationPage: prev.currentPage > 1 ? prev.currentPage - 1 : 1,
            }))
          }
        >
          Decrease
        </button>
        <div
          style={{
            height: "20px",
            backgroundColor: "grey",
            borderRadius: "5px",
            textAlign: "center",
            padding: "0 5px",
          }}
        >
          {"Current page: " + state.currentPage}
        </div>
        <button
          style={{
            width: "70px",
            height: "20px",
            backgroundColor: "grey",
            borderRadius: "5px",
          }}
          onClick={() =>
            setState((prev) => ({
              ...prev,
              destinationPage:
                prev.currentPage < prev.pageCount
                  ? prev.currentPage + 1
                  : prev.currentPage,
            }))
          }
        >
          Increase
        </button>
        <div
          style={{
            height: "20px",
            backgroundColor: "grey",
            borderRadius: "5px",
            textAlign: "center",
            padding: "0 5px",
          }}
        >
          {"Pages: " + state.pageCount}
        </div>
        <button
          style={{
            width: "auto",
            height: "20px",
            backgroundColor: "grey",
            borderRadius: "5px",
          }}
          onClick={() => setState((prev) => ({ ...prev, destinationPage: 1 }))}
        >
          Back to Page 1
        </button>
      </div>
      <Sidebar
        highlightRefs={commentRefs}
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
        categoryLabels={state.categoryLabels}
        setCategoryLabels={setCategoryLabels}
        setPdfUrl={(url) => {
          setState((prev) => ({ ...prev, url, data: null, highlights: [] }));
        }}
        setPdfData={(data) => {
          setState((prev) => ({ ...prev, data, url: "", highlights: [] }));
        }}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
      >
        <PdfLoader url={testPdf} beforeLoad={<Spinner />} data={data}>
          {(pdfDocument) => (
            <PdfHighlighter
              categoryLabels={state.categoryLabels}
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={resetHash}
              // pdfScaleValue="page-width"
              scrollRef={(scrollTo) => {
                scrollViewerTo = scrollTo;

                scrollToHighlightFromHash();
              }}
              destinationPage={state.destinationPage}
              getPageCount={(pageCount) => {
                setState((prev) => ({ ...prev, pageCount }));
              }}
              getCurrentPage={(currentPage) => {
                setState((prev) => ({ ...prev, currentPage }));
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection,
                categoryLabels
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });

                    hideTipAndSelection();
                  }}
                  categoryLabels={categoryLabels}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !Boolean(
                  highlight.content && highlight.content.image
                );

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                    categoryLabels={state.categoryLabels}
                    pointerEvents={state.flag}
                    onClick={() => { console.log(getHighlightIndex(highlight.id)); commentRefs.current[getHighlightIndex(highlight.id)].current?.scrollIntoView() }}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                    comment={highlight.comment}
                    categoryLabels={state.categoryLabels}
                  />
                );

                return (
                  // the actual popup portion doesnt work (only component shows rn)
                  // this is because `pointer-events:none` in highlight.tsx
                  // TODO :: fix this
                  <Popup
                    popupContent={<HighlightPopup {...highlight} />}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                    children={component}
                  />
                );
              }}
              highlights={highlights}
              selectionMode={!state.flag}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}

export default App;
