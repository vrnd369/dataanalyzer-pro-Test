from fastapi import HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
import numpy as np
import re
from enum import Enum

class SentimentLabel(str, Enum):
    POSITIVE = "Positive"
    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"

class SentimentScore(BaseModel):
    score: float
    label: SentimentLabel
    confidence: float
    text: str

class SentimentStats(BaseModel):
    positive: int
    negative: int
    neutral: int
    average: float
    strongest_positive: Optional[SentimentScore]
    strongest_negative: Optional[SentimentScore]

class SentimentRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1)
    custom_lexicons: Optional[Dict[str, List[str]]] = None

    @validator('texts')
    def validate_texts(cls, v):
        if not all(isinstance(text, str) and text.strip() for text in v):
            raise ValueError("All texts must be non-empty strings")
        return v

def analyze_sentiment(request: SentimentRequest) -> Dict:
    try:
        # Initialize lexicons with weights
        positive_words = {
            'good': 1.0, 'great': 1.5, 'excellent': 2.0, 'amazing': 2.0, 
            'wonderful': 1.8, 'fantastic': 1.8, 'happy': 1.5, 'pleased': 1.2,
            'delighted': 1.8, 'love': 2.0, 'awesome': 1.8, 'best': 1.5,
            'perfect': 2.0, 'brilliant': 1.8, 'outstanding': 1.8, 'beautiful': 1.5,
            'helpful': 1.2, 'impressive': 1.5, 'innovative': 1.5, 'efficient': 1.2,
            'reliable': 1.2, 'recommended': 1.2, 'satisfied': 1.2, 'positive': 1.0,
            'success': 1.5, 'successful': 1.5, 'easy': 1.0, 'enjoyed': 1.2,
            'beneficial': 1.2, 'exceptional': 1.8, 'superb': 1.8, 'remarkable': 1.5,
            'joy': 1.5, 'like': 1.0, 'admire': 1.2, 'pleasure': 1.2,
            'favorite': 1.2, 'smooth': 1.0, 'quick': 1.0, 'fast': 1.0
        }
        
        negative_words = {
            'bad': 1.0, 'poor': 1.2, 'terrible': 2.0, 'awful': 1.8,
            'horrible': 2.0, 'worst': 2.0, 'sad': 1.2, 'angry': 1.5,
            'upset': 1.2, 'hate': 2.0, 'disappointing': 1.5, 'disappointed': 1.2,
            'frustrating': 1.5, 'useless': 1.8, 'waste': 1.5, 'difficult': 1.2,
            'confusing': 1.2, 'unreliable': 1.5, 'inefficient': 1.2, 'expensive': 1.0,
            'slow': 1.0, 'broken': 1.5, 'failed': 1.5, 'failure': 1.5,
            'problem': 1.2, 'issue': 1.0, 'bug': 1.0, 'error': 1.0,
            'complicated': 1.2, 'annoying': 1.2, 'inadequate': 1.5, 'inferior': 1.5,
            'regret': 1.2, 'dislike': 1.2, 'unhappy': 1.2, 'problematic': 1.2,
            'trouble': 1.0, 'hard': 1.0
        }

        # Add custom lexicons if provided
        if request.custom_lexicons:
            if 'positive' in request.custom_lexicons:
                for word in request.custom_lexicons['positive']:
                    positive_words[word.lower()] = 1.0
            if 'negative' in request.custom_lexicons:
                for word in request.custom_lexicons['negative']:
                    negative_words[word.lower()] = 1.0

        lexicon_info = {
            "positive_words": len(positive_words),
            "negative_words": len(negative_words)
        }

        results = []
        for text in request.texts:
            # Clean and normalize text
            cleaned_text = re.sub(r'[^\w\s]', ' ', text.lower())
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
            
            words = cleaned_text.split()
            if not words:
                results.append({
                    "score": 0.0,
                    "label": SentimentLabel.NEUTRAL,
                    "confidence": 0.0,
                    "text": text
                })
                continue

            positive_score = 0.0
            negative_score = 0.0
            sentiment_words = 0
            total_weight = 0.0

            for i, word in enumerate(words):
                prev_words = words[max(0, i-3):i]
                
                # Check for negation and intensifiers
                is_negated = any(w in {'not', 'no', 'never', "don't", "doesn't", "didn't", 
                                     "can't", "won't", "isn't", "wasn't", "weren't"} 
                                for w in prev_words)
                is_intensified = any(w in {'very', 'extremely', 'absolutely', 'completely', 
                                         'totally', 'utterly', 'incredibly', 'really'} 
                                   for w in prev_words)
                
                # Calculate word weight
                weight = 2.0 if is_intensified else 1.0
                weight = 0.5 if is_negated else weight

                if word in positive_words:
                    score = positive_words[word] * weight
                    if is_negated:
                        negative_score += score
                    else:
                        positive_score += score
                    sentiment_words += 1
                    total_weight += weight
                
                if word in negative_words:
                    score = negative_words[word] * weight
                    if is_negated:
                        positive_score += score
                    else:
                        negative_score += score
                    sentiment_words += 1
                    total_weight += weight

            # Calculate final score and confidence
            total_score = positive_score - negative_score
            normalized_score = total_score / (len(words) + 1)  # Add 1 to avoid division by zero
            
            # Calculate confidence based on multiple factors
            sentiment_ratio = sentiment_words / len(words)
            weight_factor = min(total_weight / (len(words) + 1), 1.0)
            score_magnitude = min(abs(normalized_score) * 2, 1.0)
            
            confidence = (sentiment_ratio * 0.4 + weight_factor * 0.3 + score_magnitude * 0.3)

            # Determine sentiment label
            if abs(normalized_score) < 0.05 or sentiment_words == 0:
                label = SentimentLabel.NEUTRAL
                confidence *= 0.8  # Reduce confidence for neutral results
            else:
                label = SentimentLabel.POSITIVE if normalized_score > 0 else SentimentLabel.NEGATIVE

            results.append({
                "score": normalized_score,
                "label": label,
                "confidence": confidence,
                "text": text
            })

        # Calculate statistics
        positive_entries = [r for r in results if r["label"] == SentimentLabel.POSITIVE]
        negative_entries = [r for r in results if r["label"] == SentimentLabel.NEGATIVE]
        neutral_entries = [r for r in results if r["label"] == SentimentLabel.NEUTRAL]

        stats = {
            "positive": len(positive_entries),
            "negative": len(negative_entries),
            "neutral": len(neutral_entries),
            "average": np.mean([r["score"] for r in results]) if results else 0,
            "strongest_positive": max(positive_entries, key=lambda x: x["score"], default=None),
            "strongest_negative": min(negative_entries, key=lambda x: x["score"], default=None)
        }

        return {
            "lexicon_info": lexicon_info,
            "sentiments": results,
            "stats": stats
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 