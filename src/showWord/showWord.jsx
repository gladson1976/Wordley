import { useCallback } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames'
import './showWord.css'

function ShowWord(props) {
    const { wordley = '', validations = [] } = props;
    const padWordley = useCallback((word, padLength = 5, padChar = ' ') => {
        return _.padEnd(word, padLength, padChar);
    }, []);

    // const showDefinition = useCallback(() => {
    //     if (_.trim(wordley).length === 5) {
    //         return <a href={`https://www.google.com/search?q=define+${wordley}`}
    //             rel="noreferrer"
    //             target="_blank"
    //             className="define-word-link"
    //         >
    //             <span
    //                 className="material-icons define-word"
    //                 hidden={_.trim(wordley).length !== 5}
    //             />
    //         </a>
    //     }
    //     return <span className="material-icons define-word-empty" />;
    // }, [wordley]);

    const showLetter = useCallback((letter, index) => {
        if (validations.length === 0) {
            _.fill(validations, 0, 0, 5);
        }
        return <div key={`wordley${index}`} className={classNames('wordley-bit', {
            'wordley-clear': validations[index] === 0,
            'wordley-correct': validations[index] === 1,
            'wordley-maybe': validations[index] === 2,
            'wordley-no': validations[index] === 3,
            'wordley-error': validations[index] === 4,
            'earthquake': validations[index] === 4
        })}>{letter}</div>
    }, [validations]);

    const showWord = useCallback(() => {
        const text = padWordley(wordley).split('');
        return text.map((letter, index) => {
            return showLetter(letter, index);
        });
    }, [showLetter, wordley]);

    return (
        <div className='wordley-word'>
            {showWord()}
            {/* {showDefinition()} */}
        </div>
    );
};

ShowWord.propTypes = {
    wordley: PropTypes.string,
    validations: PropTypes.array
};

export default ShowWord;