"use client";
import { useState, useEffect, useContext } from "react";
import { Article } from "@/types/Article";
import { SearchContext, SearchContextProps } from "@/contexts/SearchContext";
import Card from "@/components/News/Card";
import Loading from "@/components/Loader/Loading";
import MultiSelectDropdown from "@/components/Dropdown/Multiselect";
import SingleSelectDropdown from "@/components/Dropdown/Singleselect";

const NewsDisplay = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [originalTickers, setOriginalTickers] = useState<string[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const sentimentOptions = ["Positive", "Negative", "Neutral"];
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(
    null
  );
  const priceActionOptions = ["Positive", "Negative", "NA"];
  const [selectedPriceAction, setSelectedPriceAction] = useState<string | null>(
    null
  );
  const { searchQuery, category } = useContext(
    SearchContext
  ) as SearchContextProps;

  const loadArticles = async () => {
    try {
      if (!loading) {
        setLoadingMore(true);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/articles/${page}`
      );

      // Add new articles
      const data = await response.json();
      setArticles((prevArticles) => [...prevArticles, ...data.articles]);
      setPage((prevPage) => prevPage + 1);

      // Update dropdown tickers
      setOriginalTickers((prevTickers) => {
        const newTickers = Array.from(
          new Set([
            ...prevTickers,
            ...data.articles.flatMap((article: Article) => article.ticker),
          ])
        );
        return newTickers;
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadArticles();
    setLoading(false);
  }, []);

  // Filter by keyword using searchbar
  const filterArticlesUsingSearch = () => {
    if (category === "News" && searchQuery.length !== 0 && articles) {
      const searchWords = new Set(searchQuery.toLowerCase().split(/\s+/));
      const filteredArticles = articles.filter((item: Article) => {
        const titleWords = item.title.toLowerCase().split(/\s+/);
        const titleMatch = titleWords.some((word) => searchWords.has(word));
        const tickerMatch = searchWords.has(item.ticker.toLowerCase());
        const sentimentMatch = searchWords.has(item.sentiment.toLowerCase());
        return titleMatch || tickerMatch || sentimentMatch;
      });
      return filteredArticles;
    } else {
      return articles;
    }
  };

  // Filter by stock multiselect dropdown
  const filterArticlesByTicker = (articles: Article[]) => {
    const selected = new Set(selectedTickers);
    if (selected.size !== 0) {
      const filteredArticles = articles.filter((article) =>
        selected.has(article.ticker)
      );
      return filteredArticles;
    } else {
      return articles;
    }
  };

  // Filter by sentiment dropdown
  const filterArticlesBySentiment = (articles: Article[]) => {
    if (selectedSentiment) {
      return articles.filter(
        (article) => selectedSentiment === article.sentiment
      );
    } else {
      return articles;
    }
  };

  // Filter by price action dropdown
  const filterArticlesByPrice = (articles: Article[]) => {
    return articles.filter((article) => {
      switch (selectedPriceAction) {
        case "Positive":
          console.log(article.close_price)
          return article.close_price > article.open_price;
        case "Negative":
          return article.close_price < article.open_price;
          case "NA":
            return article.close_price == null
        default:
          return true;
      }
    });
  };

  const filterArticles = () =>
    filterArticlesByPrice(
      filterArticlesBySentiment(
        filterArticlesByTicker(filterArticlesUsingSearch())
      )
    );
  
  const filteredArticles = filterArticles()

  return (
    <div className="max-w-screen-lg mx-auto mt-3 mb-20">
      {loading ? (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-4 ">
          <Loading />
        </div>
      ) : (
        <>
          <div className="mx-10">
            <div className="font-bold text-5xl mb-2">News</div>
            <div className="mt-3 text-xl">View the latest financial news</div>
            <div className="border-b border-gray-400 mb-2m mt-3"></div>
            <div className="mt-5 flex gap-3">
              <MultiSelectDropdown
                originalOptions={originalTickers}
                selectedOptions={selectedTickers}
                setSelectedOptions={setSelectedTickers}
              />
              <SingleSelectDropdown
                placeholder={"Sentiment"}
                originalOptions={sentimentOptions}
                selectedOption={selectedSentiment}
                setSelectedOption={setSelectedSentiment}
              />
              <SingleSelectDropdown
                placeholder={"Price Action"}
                originalOptions={priceActionOptions}
                selectedOption={selectedPriceAction}
                setSelectedOption={setSelectedPriceAction}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-5 mx-10">
            {filteredArticles.map((article: Article, index: number) => (
              <Card
                key={index}
                title={article.title}
                publication_datetime={article.publication_datetime}
                summary={article.summary}
                ticker={article.ticker}
                sentiment={article.sentiment}
                image_url={article.image_url}
                article_url={article.article_url}
                market_date={article.market_date}
                open_price={article.open_price}
                close_price={article.close_price}
              />
            ))}
          </div>

          <div className="flex justify-center">
            {loadingMore ? (
              <div className="mt-10">
                <Loading />
              </div>
            ) : (
              filteredArticles.length != 0 ? (
                <button
                  className={
                    "mt-10 border text-green-500 border-green-500 hover:text-white hover:bg-green-600 transform hover:scale-105 font-semibold py-2 px-4 rounded inline-block transition duration-300 ease-in-out cursor-pointer"
                  }
                  onClick={loadArticles}
                >
                  Load More
                </button>
              ) : (
                <div>No Articles Available</div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsDisplay;
